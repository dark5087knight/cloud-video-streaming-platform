import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListMultipartUploadsCommand,
  ListMultipartUploadsCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { UploadRepository } from './upload.repository';
import { Upload, UploadStatus } from './entities/upload.entity';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { GetPresignedPartUrlDto } from './dto/get-presigned-part-url.dto';
import { RecordPartDto } from './dto/record-part.dto';
import { VideoService } from '../video/video.service';
import { VideoMetadataService } from '../video-metadata/video-metadata.service';
import { VideoStatus } from '../video/entities/video.entity';
import {
  RenditionStatus,
  VideoRendition,
} from '../video/entities/video-rendition.entity';
import {
  ProcessingJobStatus,
  ProcessingJobType,
} from '../video/entities/video-processing-job.entity';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserRole } from '../user/entities/user.entity';
import { SqsService } from '../sqs/sqs.service';
import { SQS_QUEUES } from '../sqs/sqs.constants';
import { VideoProcessingMessage } from '../sqs/interfaces/video-processing-message.interface';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  // Clamped part size constants: 5 MB (AWS S3 min) to 500 MB, default 10 MB
  private static readonly MIN_PART_SIZE = 5242880; // 5 MB (AWS S3 minimum limit)
  private static readonly MAX_PART_SIZE = 524288000; // 500 MB
  private static readonly DEFAULT_PART_SIZE = 10485760; // 10 MB

  constructor(
    private readonly uploadRepository: UploadRepository,
    @Inject(forwardRef(() => VideoService))
    private readonly videoService: VideoService,
    private readonly videoMetadataService: VideoMetadataService,
    private readonly configService: ConfigService,
    private readonly sqsService: SqsService,
  ) {
    const region =
      this.configService.get<string>('S3_REGION') ||
      this.configService.get<string>('AWS_REGION', 'eu-central-1');
    const accessKeyId =
      this.configService.get<string>('S3_ACCESS_KEY_ID') ||
      this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey =
      this.configService.get<string>('S3_SECRET_ACCESS_KEY') ||
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucketName =
      this.configService.get<string>('S3_BUCKET') ||
      this.configService.get<string>('AWS_S3_BUCKET') ||
      '';

    this.s3Client = new S3Client({
      region,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });
  }

  async initiateUpload(
    dto: InitiateUploadDto,
    currentUser: AuthenticatedUser,
  ) {
    // 1. Clamp chunk size strictly between 5 MB and 500 MB
    let partSize = dto.partSize ?? UploadService.DEFAULT_PART_SIZE;
    if (partSize < UploadService.MIN_PART_SIZE) {
      partSize = UploadService.MIN_PART_SIZE;
    } else if (partSize > UploadService.MAX_PART_SIZE) {
      partSize = UploadService.MAX_PART_SIZE;
    }

    const totalParts = Math.ceil(dto.fileSize / partSize);
    if (totalParts > 10000) {
      throw new BadRequestException(
        'File size exceeds AWS S3 multipart limits (max 10,000 parts). Please increase part size.',
      );
    }

    const ext = dto.format ? dto.format.replace('.', '') : 'mp4';

    // 2. Resolve or create domain Video entity
    let videoId: string;
    let s3Key: string;

    if (dto.videoId) {
      const existingVideo = await this.videoService.getById(dto.videoId);
      this.verifyOwnership(existingVideo.uploaderId, currentUser);
      videoId = existingVideo.id;
      s3Key = `videos/${videoId}/original_${Date.now()}.${ext}`;
    } else {
      if (!dto.title && !dto.fileName) {
        throw new BadRequestException('Video title or fileName is required');
      }
      const newVideo = await this.videoService.create({
        title: dto.title ?? dto.fileName,
        description: dto.description,
        uploaderId: currentUser.id,
        status: VideoStatus.UPLOADED,
      });
      videoId = newVideo.id;
      s3Key = `videos/${videoId}/original_${Date.now()}.${ext}`;

      // Initialize technical metadata entity
      await this.videoMetadataService.create({
        videoId,
        sourceStorageKey: s3Key,
        sourceFormat: ext,
        sourceSizeBytes: dto.fileSize,
        sourceDurationSeconds: dto.duration,
        sourceHeight: dto.resolution?.includes('1080')
          ? 1080
          : dto.resolution?.includes('720')
          ? 720
          : undefined,
        size: dto.fileSize,
        duration: dto.duration,
        format: ext,
        resolution: dto.resolution ?? '1080p',
      });
    }

    // 3. Initiate AWS S3 Multipart Upload
    let s3UploadId: string;
    try {
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        ContentType: `video/${ext}`,
      });
      const s3Response = await this.s3Client.send(createCommand);
      if (!s3Response.UploadId) {
        throw new Error('S3 did not return an UploadId');
      }
      s3UploadId = s3Response.UploadId;
    } catch (err: unknown) {
      this.logger.error(`Failed to initiate S3 multipart upload: ${err}`);
      throw new BadRequestException(
        'Unable to initiate S3 storage session. Verify AWS configuration.',
      );
    }

    // 4. Persist lean Upload entity
    const upload = await this.uploadRepository.create({
      videoId,
      s3UploadId,
      s3Key,
      partSize,
      totalParts,
    });

    return {
      uploadId: upload.id,
      videoId,
      s3Key,
      partSize,
      totalParts,
      status: upload.status,
    };
  }

  async getPresignedPartUrl(
    dto: GetPresignedPartUrlDto,
    currentUser: AuthenticatedUser,
  ) {
    const upload = await this.uploadRepository.findById(dto.uploadId);
    const uploaderId = await this.getUploaderId(upload);
    this.verifyOwnership(uploaderId, currentUser);

    if (upload.status === UploadStatus.COMPLETED) {
      throw new BadRequestException('Upload session is already completed');
    }
    if (upload.status === UploadStatus.ABORTED) {
      throw new BadRequestException('Upload session has been aborted');
    }

    if (dto.partNumber < 1 || dto.partNumber > upload.totalParts) {
      throw new BadRequestException(
        `Part number must be between 1 and ${upload.totalParts}`,
      );
    }

    // Presign UploadPartCommand (valid for 15 minutes / 900 seconds)
    const command = new UploadPartCommand({
      Bucket: this.bucketName,
      Key: upload.s3Key,
      UploadId: upload.s3UploadId,
      PartNumber: dto.partNumber,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900,
    });

    if (upload.status === UploadStatus.INITIATED) {
      await this.uploadRepository.updateStatus(upload.id, UploadStatus.UPLOADING);
    }

    return {
      uploadId: upload.id,
      partNumber: dto.partNumber,
      presignedUrl,
      expiresInSeconds: 900,
    };
  }

  async recordPart(dto: RecordPartDto, currentUser: AuthenticatedUser) {
    const upload = await this.uploadRepository.findById(dto.uploadId);
    const uploaderId = await this.getUploaderId(upload);
    this.verifyOwnership(uploaderId, currentUser);

    if (dto.partNumber < 1 || dto.partNumber > upload.totalParts) {
      throw new BadRequestException(
        `Invalid part number: must be between 1 and ${upload.totalParts}`,
      );
    }

    // Clean etag string if wrapped in extra quotes
    const cleanEtag = dto.etag.trim();

    const part = await this.uploadRepository.recordPart({
      uploadId: dto.uploadId,
      partNumber: dto.partNumber,
      etag: cleanEtag,
      size: dto.size,
    });

    if (upload.status === UploadStatus.INITIATED) {
      await this.uploadRepository.updateStatus(upload.id, UploadStatus.UPLOADING);
    }

    return {
      success: true,
      partNumber: part.partNumber,
      size: part.size,
    };
  }

  async getUploadStatus(uploadId: string, currentUser: AuthenticatedUser) {
    const upload = await this.uploadRepository.findById(uploadId);
    const uploaderId = await this.getUploaderId(upload);
    this.verifyOwnership(uploaderId, currentUser);

    const parts = await this.uploadRepository.getParts(uploadId);
    const confirmedPartNumbers = new Set(parts.map((p) => p.partNumber));

    const missingPartNumbers: number[] = [];
    for (let i = 1; i <= upload.totalParts; i++) {
      if (!confirmedPartNumbers.has(i)) {
        missingPartNumbers.push(i);
      }
    }

    const uploadedBytes = parts.reduce((sum, p) => sum + Number(p.size), 0);
    const totalBytes =
      upload.video?.metadata?.size ??
      upload.video?.metadata?.sourceSizeBytes ??
      upload.partSize * upload.totalParts;
    const progressPercentage =
      totalBytes > 0
        ? Math.min(100, Math.round((uploadedBytes / Number(totalBytes)) * 100))
        : 0;

    return {
      uploadId: upload.id,
      videoId: upload.videoId,
      status: upload.status,
      partSize: upload.partSize,
      totalParts: upload.totalParts,
      uploadedPartsCount: parts.length,
      uploadedParts: parts.map((p) => ({
        partNumber: p.partNumber,
        etag: p.etag,
        size: Number(p.size),
      })),
      missingPartNumbers,
      uploadedBytes,
      totalBytes: Number(totalBytes),
      progressPercentage,
      isCompleteReady: parts.length === upload.totalParts,
    };
  }

  async completeUpload(uploadId: string, currentUser: AuthenticatedUser) {
    const upload = await this.uploadRepository.findById(uploadId);
    const uploaderId = await this.getUploaderId(upload);
    this.verifyOwnership(uploaderId, currentUser);

    if (upload.status === UploadStatus.COMPLETED) {
      return {
        videoId: upload.videoId,
        status: VideoStatus.PROCESSING,
        message: 'Upload already completed',
      };
    }

    const parts = await this.uploadRepository.getParts(uploadId);
    if (parts.length < upload.totalParts) {
      throw new BadRequestException(
        `Cannot complete upload: only ${parts.length} of ${upload.totalParts} parts recorded`,
      );
    }

    // Strict S3 requirement: parts must be sorted ascending by PartNumber
    const sortedParts = parts
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((p) => ({
        PartNumber: p.partNumber,
        ETag: p.etag,
      }));

    try {
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: upload.s3Key,
        UploadId: upload.s3UploadId,
        MultipartUpload: {
          Parts: sortedParts,
        },
      });
      await this.s3Client.send(completeCommand);
    } catch (err: unknown) {
      this.logger.error(`S3 CompleteMultipartUpload failed: ${err}`);
      throw new BadRequestException(
        'Failed to finalize S3 multipart assembly. Ensure all parts are valid.',
      );
    }

    // 1. Mark upload session completed
    await this.uploadRepository.updateStatus(upload.id, UploadStatus.COMPLETED);

    // 2. Set video status to PROCESSING (workers will process renditions)
    await this.videoService.update(upload.videoId, {
      status: VideoStatus.PROCESSING,
    });

    // 3. Ensure metadata source storage key is set
    const existingMetadata = await this.videoMetadataService.findByVideoId(
      upload.videoId,
    );
    if (existingMetadata) {
      await this.videoMetadataService.update(existingMetadata.id, {
        sourceStorageKey: upload.s3Key,
      });
    }

    // 4. Pre-create Video Renditions in DB
    const renditionProfiles = [
      {
        profileKey: 'hls_360p_h264',
        width: 640,
        height: 360,
        videoCodec: 'h264',
        audioCodec: 'aac',
        videoBitrateBps: 800000,
        audioBitrateBps: 96000,
        storageKey: `videos/${upload.videoId}/renditions/360p/playlist.m3u8`,
        status: RenditionStatus.PENDING,
      },
      {
        profileKey: 'hls_480p_h264',
        width: 854,
        height: 480,
        videoCodec: 'h264',
        audioCodec: 'aac',
        videoBitrateBps: 1400000,
        audioBitrateBps: 128000,
        storageKey: `videos/${upload.videoId}/renditions/480p/playlist.m3u8`,
        status: RenditionStatus.PENDING,
      },
      {
        profileKey: 'hls_720p_h264',
        width: 1280,
        height: 720,
        videoCodec: 'h264',
        audioCodec: 'aac',
        videoBitrateBps: 2800000,
        audioBitrateBps: 128000,
        storageKey: `videos/${upload.videoId}/renditions/720p/playlist.m3u8`,
        status: RenditionStatus.PENDING,
      },
      {
        profileKey: 'hls_1080p_h264',
        width: 1920,
        height: 1080,
        videoCodec: 'h264',
        audioCodec: 'aac',
        videoBitrateBps: 5000000,
        audioBitrateBps: 192000,
        storageKey: `videos/${upload.videoId}/renditions/1080p/playlist.m3u8`,
        status: RenditionStatus.PENDING,
      },
    ];

    let createdRenditions: VideoRendition[] = [];
    const existingRenditions = await this.videoService.getRenditionsByVideoId(
      upload.videoId,
    );
    if (!existingRenditions || existingRenditions.length === 0) {
      createdRenditions = await this.videoService.createRenditions(
        renditionProfiles.map((p) => ({
          videoId: upload.videoId,
          ...p,
        })),
      );
    } else {
      createdRenditions = existingRenditions;
    }

    // 5. Create Video Processing Job record
    const job = await this.videoService.createProcessingJob({
      videoId: upload.videoId,
      jobType: ProcessingJobType.TRANSCODE,
      status: ProcessingJobStatus.QUEUED,
      attemptCount: 0,
      maxAttempts: 3,
    });

    // 6. Build message payload for SQS
    const video = await this.videoService.getById(upload.videoId);
    const totalSizeBytes = parts.reduce((sum, p) => sum + Number(p.size), 0);

    const message: VideoProcessingMessage = {
      jobId: job.id,
      videoId: upload.videoId,
      jobType: 'transcode',
      source: {
        bucket: this.bucketName,
        key: upload.s3Key,
        format: video.metadata?.sourceFormat ?? 'mp4',
        sizeBytes: video.metadata?.sourceSizeBytes
          ? Number(video.metadata.sourceSizeBytes)
          : totalSizeBytes,
      },
      renditions: createdRenditions.map((r) => ({
        renditionId: r.id,
        profileKey: r.profileKey,
        width: r.width,
        height: r.height,
        videoCodec: r.videoCodec,
        audioCodec: r.audioCodec ?? 'aac',
        videoBitrateBps: Number(r.videoBitrateBps ?? 0),
        audioBitrateBps: Number(r.audioBitrateBps ?? 0),
        storageKey: r.storageKey,
      })),
      attempt: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
    };

    // 7. Publish to SQS processing queue
    let queueMessageId: string | null = null;
    try {
      queueMessageId = await this.sqsService.publish(
        SQS_QUEUES.VIDEO_PROCESSING,
        message,
      );
      await this.videoService.updateProcessingJob(job.id, {
        queueMessageId,
      });
      this.logger.log(
        `Dispatched video processing job ${job.id} for video ${upload.videoId} (messageId: ${queueMessageId}) to SQS`,
      );
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(
        `Failed to publish job ${job.id} to SQS: ${error.message}`,
        error.stack,
      );
      await this.videoService.updateProcessingJob(job.id, {
        errorMessage: `SQS publish failed: ${error.message}`,
      });
    }

    return {
      videoId: upload.videoId,
      jobId: job.id,
      queueMessageId,
      status: VideoStatus.PROCESSING,
      message: 'Video upload and assembly completed, queued for transcoding',
    };
  }

  async abortUpload(uploadId: string, currentUser: AuthenticatedUser) {
    const upload = await this.uploadRepository.findById(uploadId);
    const uploaderId = await this.getUploaderId(upload);
    this.verifyOwnership(uploaderId, currentUser);

    try {
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: upload.s3Key,
        UploadId: upload.s3UploadId,
      });
      await this.s3Client.send(abortCommand);
    } catch (err: unknown) {
      this.logger.warn(`S3 AbortMultipartUpload warning: ${err}`);
    }

    await this.uploadRepository.updateStatus(upload.id, UploadStatus.ABORTED);
    await this.videoService.update(upload.videoId, {
      status: VideoStatus.FAILED,
    });

    return {
      success: true,
      message: 'Upload session aborted and S3 storage freed',
    };
  }

  async getPlaybackUrl(videoId: string) {
    // 1. Fetch video record
    const video = await this.videoService.getById(videoId);
    if (!video) {
      throw new NotFoundException(`Video with ID ${videoId} not found`);
    }

    // 2. Fetch completed upload session or any session with S3 key
    let upload = await this.uploadRepository.findCompletedByVideoId(videoId);
    if (!upload) {
      upload = await this.uploadRepository.findByVideoId(videoId);
    }

    if (!upload || !upload.s3Key) {
      throw new NotFoundException(
        `No uploaded video asset found in S3 for video "${video.title}"`,
      );
    }

    // 3. Generate presigned GET URL for secure video playback (valid for 1 hour / 3600 seconds)
    const expiresInSeconds = 3600;
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: upload.s3Key,
    });

    try {
      const playbackUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      return {
        videoId: video.id,
        title: video.title,
        playbackUrl,
        expiresInSeconds,
        format: video.metadata?.sourceFormat ?? video.metadata?.format ?? 'mp4',
        resolution: video.metadata?.resolution ?? '1080p',
        status: video.status,
      };
    } catch (err: unknown) {
      this.logger.error(`Failed to generate presigned S3 playback URL: ${err}`);
      throw new BadRequestException('Failed to generate secure S3 playback URL');
    }
  }

  private async getUploaderId(upload: Upload): Promise<string> {
    if (upload.video && upload.video.uploaderId) {
      return upload.video.uploaderId;
    }
    if (upload.videoId) {
      const video = await this.videoService.getById(upload.videoId);
      if (video && video.uploaderId) {
        return video.uploaderId;
      }
    }
    throw new NotFoundException(
      'Associated video not found for this upload session',
    );
  }

  private verifyOwnership(
    uploaderId: string,
    currentUser: AuthenticatedUser,
  ): void {
    if (
      currentUser.role === UserRole.USER &&
      currentUser.id !== uploaderId
    ) {
      throw new ForbiddenException(
        'Cannot modify upload sessions belonging to other creators',
      );
    }
  }

  /**
   * Recursively delete all S3 files associated with a video (original, renditions, chunks, playlists, thumbnails)
   * and abort any dangling multipart uploads.
   */
  async deleteVideoStorage(
    videoId: string,
    additionalKeys: string[] = [],
  ): Promise<number> {
    const prefix = `videos/${videoId}/`;
    let deletedCount = 0;

    // 1. Abort any dangling or active multipart uploads for this video prefix
    try {
      let isMultipartTruncated = true;
      let keyMarker: string | undefined = undefined;
      let uploadIdMarker: string | undefined = undefined;

      while (isMultipartTruncated) {
        const listMpCmd = new ListMultipartUploadsCommand({
          Bucket: this.bucketName,
          Prefix: prefix,
          KeyMarker: keyMarker,
          UploadIdMarker: uploadIdMarker,
        });
        const mpRes: ListMultipartUploadsCommandOutput =
          await this.s3Client.send(listMpCmd);
        if (mpRes.Uploads && mpRes.Uploads.length > 0) {
          for (const u of mpRes.Uploads) {
            if (u.Key && u.UploadId) {
              try {
                await this.s3Client.send(
                  new AbortMultipartUploadCommand({
                    Bucket: this.bucketName,
                    Key: u.Key,
                    UploadId: u.UploadId,
                  }),
                );
              } catch (abortErr) {
                this.logger.warn(
                  `Could not abort multipart upload ${u.UploadId}: ${abortErr}`,
                );
              }
            }
          }
        }
        isMultipartTruncated = mpRes.IsTruncated ?? false;
        keyMarker = mpRes.NextKeyMarker;
        uploadIdMarker = mpRes.NextUploadIdMarker;
      }
    } catch (mpError) {
      this.logger.warn(
        `Error listing active multipart uploads for video ${videoId}: ${mpError}`,
      );
    }

    // 2. Paginate and delete all S3 objects under prefix 'videos/${videoId}/'
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;

    while (isTruncated) {
      const listCmd = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const listRes: ListObjectsV2CommandOutput =
        await this.s3Client.send(listCmd);

      if (listRes.Contents && listRes.Contents.length > 0) {
        const objectsToDelete = listRes.Contents
          .map((item) => ({ Key: item.Key }))
          .filter((item): item is { Key: string } => !!item.Key);

        if (objectsToDelete.length > 0) {
          const deleteCmd = new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
              Objects: objectsToDelete,
              Quiet: true,
            },
          });
          await this.s3Client.send(deleteCmd);
          deletedCount += objectsToDelete.length;
        }
      }

      isTruncated = listRes.IsTruncated ?? false;
      continuationToken = listRes.NextContinuationToken;
    }

    // 3. Delete any extra specific keys if provided and not already deleted
    for (const key of additionalKeys) {
      if (key && !key.startsWith(prefix)) {
        try {
          await this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: this.bucketName,
              Key: key,
            }),
          );
          deletedCount++;
        } catch (delErr) {
          this.logger.warn(`Could not delete extra S3 key ${key}: ${delErr}`);
        }
      }
    }

    this.logger.log(
      `Cleaned up S3 storage for video ${videoId}: deleted ${deletedCount} object(s)`,
    );
    return deletedCount;
  }
}
