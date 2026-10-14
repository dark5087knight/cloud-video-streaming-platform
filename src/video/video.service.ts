import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Video } from './entities/video.entity';
import { VideoRendition } from './entities/video-rendition.entity';
import { VideoProcessingJob } from './entities/video-processing-job.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { GetVideoDto } from './dto/get-video.dto';
import { VideoRepository } from './video.repository';
import { GetAll } from '../common/interfaces/get-all.interface';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private readonly videoRepository: VideoRepository,
    @Inject(forwardRef(() => UploadService))
    private readonly uploadService: UploadService,
  ) {}

  async create(createDto: CreateVideoDto): Promise<Video> {
    return this.videoRepository.create(createDto);
  }

  async getAll(getQuery: GetVideoDto): Promise<GetAll<Video>> {
    return this.videoRepository.getAll(getQuery);
  }

  async getById(id: string, getQuery?: GetVideoDto): Promise<Video> {
    return this.videoRepository.getById(id, getQuery ?? {});
  }

  async update(id: string, updateDto: UpdateVideoDto): Promise<Video> {
    return this.videoRepository.update(id, updateDto);
  }

  async delete(id: string): Promise<void> {
    // 1. Fetch video record with related metadata & renditions to collect any storage keys
    const video = await this.videoRepository.findByIdWithDeleted(id);
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    const additionalKeys: string[] = [];
    if (video.metadata?.sourceStorageKey) {
      additionalKeys.push(video.metadata.sourceStorageKey);
    }
    if (video.renditions && video.renditions.length > 0) {
      for (const r of video.renditions) {
        if (r.storageKey) {
          additionalKeys.push(r.storageKey);
        }
      }
    }

    // 2. Recursively delete all files under videos/{id}/ and dangling multipart uploads from AWS S3
    try {
      await this.uploadService.deleteVideoStorage(id, additionalKeys);
    } catch (s3Error) {
      this.logger.error(
        `Failed to clean up S3 storage for video ${id}: ${s3Error instanceof Error ? s3Error.message : s3Error}`,
      );
      // Proceed with DB deletion so the record isn't orphaned in the database
    }

    // 3. Hard delete from database. PostgreSQL ON DELETE CASCADE will automatically
    // remove video_metadata, video_renditions, video_processing_jobs, and uploads (which cascades to upload_parts)
    await this.videoRepository.delete(id);

    this.logger.log(
      `Permanently deleted video ${id} and all related database records and S3 assets`,
    );
  }

  // Processing Job Methods
  async createProcessingJob(
    data: Partial<VideoProcessingJob>,
  ): Promise<VideoProcessingJob> {
    return this.videoRepository.createProcessingJob(data);
  }

  async updateProcessingJob(
    id: string,
    data: Partial<VideoProcessingJob>,
  ): Promise<VideoProcessingJob> {
    return this.videoRepository.updateProcessingJob(id, data);
  }

  async getProcessingJobsByVideoId(
    videoId: string,
  ): Promise<VideoProcessingJob[]> {
    return this.videoRepository.getProcessingJobsByVideoId(videoId);
  }

  async findProcessingJobById(
    id: string,
  ): Promise<VideoProcessingJob | null> {
    return this.videoRepository.findProcessingJobById(id);
  }

  // Rendition Methods
  async createRenditions(
    renditionsData: Partial<VideoRendition>[],
  ): Promise<VideoRendition[]> {
    return this.videoRepository.createRenditions(renditionsData);
  }

  async getRenditionsByVideoId(videoId: string): Promise<VideoRendition[]> {
    return this.videoRepository.getRenditionsByVideoId(videoId);
  }

  async updateRendition(
    id: string,
    data: Partial<VideoRendition>,
  ): Promise<VideoRendition> {
    return this.videoRepository.updateRendition(id, data);
  }

  async updateRenditionByProfile(
    videoId: string,
    profileKey: string,
    data: Partial<VideoRendition>,
  ): Promise<VideoRendition | null> {
    return this.videoRepository.updateRenditionByProfile(videoId, profileKey, data);
  }

  async updateRenditionsStatusByVideoId(
    videoId: string,
    status: any,
    errorMessage?: string | null,
  ): Promise<void> {
    return this.videoRepository.updateRenditionsStatusByVideoId(
      videoId,
      status,
      errorMessage,
    );
  }
}
