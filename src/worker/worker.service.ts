import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { VideoService } from '../video/video.service';
import { VideoMetadataService } from '../video-metadata/video-metadata.service';
import { VideoStatus } from '../video/entities/video.entity';
import { RenditionStatus } from '../video/entities/video-rendition.entity';
import { ProcessingJobStatus } from '../video/entities/video-processing-job.entity';
import { StartJobDto } from './dto/start-job.dto';
import { UpdateProbedMetadataDto } from './dto/update-probed-metadata.dto';
import { CompleteJobDto } from './dto/complete-job.dto';
import { FailJobDto } from './dto/fail-job.dto';
import { JobProgressDto } from './dto/job-progress.dto';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly videoService: VideoService,
    private readonly videoMetadataService: VideoMetadataService,
  ) {}

  async startJob(dto: StartJobDto) {
    const job = await this.videoService.findProcessingJobById(dto.jobId);
    if (!job) {
      throw new NotFoundException(`Processing job with ID ${dto.jobId} not found`);
    }

    // 1. Mark processing job as active
    await this.videoService.updateProcessingJob(job.id, {
      status: ProcessingJobStatus.PROCESSING,
      startedAt: new Date(),
      attemptCount: job.attemptCount + 1,
    });

    // 2. Mark associated video status as processing
    await this.videoService.update(job.videoId, {
      status: VideoStatus.PROCESSING,
    });

    // 3. Mark all pending renditions for this video as processing
    await this.videoService.updateRenditionsStatusByVideoId(
      job.videoId,
      RenditionStatus.PROCESSING,
    );

    this.logger.log(
      `Worker [${dto.workerId ?? 'default'}] started processing job ${job.id} for video ${job.videoId}`,
    );

    return {
      success: true,
      message: 'Job marked as processing',
      jobId: job.id,
      videoId: job.videoId,
    };
  }

  async updateMetadata(dto: UpdateProbedMetadataDto) {
    const video = await this.videoService.getById(dto.videoId);
    if (!video) {
      throw new NotFoundException(`Video with ID ${dto.videoId} not found`);
    }

    const existingMetadata = await this.videoMetadataService.findByVideoId(
      dto.videoId,
    );

    if (existingMetadata) {
      await this.videoMetadataService.update(existingMetadata.id, {
        sourceWidth: dto.sourceWidth,
        sourceHeight: dto.sourceHeight,
        sourceDurationSeconds: dto.sourceDurationSeconds,
        sourceVideoCodec: dto.sourceVideoCodec,
        sourceAudioCodec: dto.sourceAudioCodec,
        sourceFrameRate: dto.sourceFrameRate,
        sourceSizeBytes: dto.sourceSizeBytes,
        sourceFormat: dto.sourceFormat,
      });
    } else {
      await this.videoMetadataService.create({
        videoId: dto.videoId,
        sourceStorageKey: `videos/${dto.videoId}/original.mp4`,
        sourceWidth: dto.sourceWidth,
        sourceHeight: dto.sourceHeight,
        sourceDurationSeconds: dto.sourceDurationSeconds,
        sourceVideoCodec: dto.sourceVideoCodec,
        sourceAudioCodec: dto.sourceAudioCodec,
        sourceFrameRate: dto.sourceFrameRate,
        sourceSizeBytes: dto.sourceSizeBytes,
        sourceFormat: dto.sourceFormat,
      });
    }

    this.logger.log(
      `Updated technical metadata for video ${dto.videoId}: ${dto.sourceWidth}x${dto.sourceHeight}, ${dto.sourceDurationSeconds}s, codec: ${dto.sourceVideoCodec}/${dto.sourceAudioCodec}`,
    );

    return {
      success: true,
      message: 'Video metadata synchronized successfully',
      videoId: dto.videoId,
    };
  }

  async updateProgress(dto: JobProgressDto) {
    this.logger.log(
      `Job [${dto.jobId}] progress: ${dto.percent}% - ${dto.stage ?? 'processing'}`,
    );

    return {
      success: true,
      jobId: dto.jobId,
      percent: dto.percent,
      stage: dto.stage,
    };
  }

  async completeJob(dto: CompleteJobDto) {
    const jobId = dto.jobId || dto.job_id;
    const videoId = dto.videoId || dto.video_id;

    if (!jobId) {
      throw new BadRequestException('jobId or job_id is required');
    }
    if (!videoId) {
      throw new BadRequestException('videoId or video_id is required');
    }

    const job = await this.videoService.findProcessingJobById(jobId);
    if (!job) {
      throw new NotFoundException(`Processing job with ID ${jobId} not found`);
    }

    // 1. Update each rendition with encoded specs and ready status
    for (const r of dto.renditions || []) {
      const renditionId = r.renditionId || r.rendition_id;
      const profileKey = r.profileKey || r.profile_key || r.profile;
      const fileSizeBytes =
        r.fileSizeBytes ?? r.file_size_bytes ?? r.size_bytes ?? r.size;
      const durationSeconds =
        r.durationSeconds ?? r.duration_seconds ?? r.duration;
      const storageKey = r.storageKey || r.storage_key || r.key;

      if (renditionId) {
        await this.videoService.updateRendition(renditionId, {
          status: RenditionStatus.READY,
          fileSizeBytes:
            fileSizeBytes !== undefined ? Number(fileSizeBytes) : undefined,
          durationSeconds:
            durationSeconds !== undefined ? Number(durationSeconds) : undefined,
          storageKey,
          errorMessage: null,
        });
      } else if (profileKey) {
        await this.videoService.updateRenditionByProfile(videoId, profileKey, {
          status: RenditionStatus.READY,
          fileSizeBytes:
            fileSizeBytes !== undefined ? Number(fileSizeBytes) : undefined,
          durationSeconds:
            durationSeconds !== undefined ? Number(durationSeconds) : undefined,
          storageKey,
          errorMessage: null,
        });
      }
    }

    // 2. Mark logical video ready for viewer streaming
    await this.videoService.update(videoId, {
      status: VideoStatus.READY,
    });

    // 3. Mark job record as completed
    await this.videoService.updateProcessingJob(jobId, {
      status: ProcessingJobStatus.COMPLETED,
      completedAt: new Date(),
      errorMessage: null,
    });

    this.logger.log(
      `Video processing job ${jobId} completed successfully! Video ${videoId} is now READY.`,
    );

    return {
      success: true,
      message: 'Video transcoding completed and video status transitioned to ready',
      videoId,
      jobId,
      renditionsCount: dto.renditions?.length ?? 0,
    };
  }

  async failJob(dto: FailJobDto) {
    const job = await this.videoService.findProcessingJobById(dto.jobId);
    if (!job) {
      throw new NotFoundException(`Processing job with ID ${dto.jobId} not found`);
    }

    // 1. Mark processing job as failed
    await this.videoService.updateProcessingJob(dto.jobId, {
      status: ProcessingJobStatus.FAILED,
      completedAt: new Date(),
      errorMessage: dto.errorMessage,
    });

    // 2. Mark renditions as failed
    await this.videoService.updateRenditionsStatusByVideoId(
      dto.videoId,
      RenditionStatus.FAILED,
      dto.errorMessage,
    );

    // 3. Mark video domain status as failed
    await this.videoService.update(dto.videoId, {
      status: VideoStatus.FAILED,
    });

    this.logger.error(
      `Processing job ${dto.jobId} failed for video ${dto.videoId}: ${dto.errorMessage}`,
    );

    return {
      success: true,
      message: 'Job marked as failed',
      jobId: dto.jobId,
      videoId: dto.videoId,
      errorMessage: dto.errorMessage,
    };
  }
}
