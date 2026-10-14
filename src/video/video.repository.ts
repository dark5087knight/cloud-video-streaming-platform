import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  ILike,
  Repository,
} from 'typeorm';

import { Video, VideoStatus, VideoVisibility } from './entities/video.entity';
import {
  RenditionStatus,
  VideoRendition,
} from './entities/video-rendition.entity';
import { VideoProcessingJob } from './entities/video-processing-job.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { GetVideoDto } from './dto/get-video.dto';
import { IRepository } from '../common/interfaces/repository.interface';
import { GetAll } from '../common/interfaces/get-all.interface';
import { validateRelations } from '../common/utils/relation-validator';

@Injectable()
export class VideoRepository implements IRepository<
  Video,
  CreateVideoDto,
  GetVideoDto,
  UpdateVideoDto
> {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    @InjectRepository(VideoRendition)
    private readonly renditionRepository: Repository<VideoRendition>,
    @InjectRepository(VideoProcessingJob)
    private readonly processingJobRepository: Repository<VideoProcessingJob>,
  ) {}

  async create(createDto: CreateVideoDto): Promise<Video> {
    const video = new Video();
    video.title = createDto.title;
    video.description = createDto.description ?? null;
    video.uploaderId = createDto.uploaderId as string;
    video.status = createDto.status ?? VideoStatus.UPLOADED;
    video.visibility = VideoVisibility.PRIVATE;
    return await this.videoRepository.save(video);
  }

  async getAll(query: GetVideoDto): Promise<GetAll<Video>> {
    const { limit, offset, relations, search, select, uploaderId, status } =
      query;
    validateRelations(this.videoRepository, relations);

    let selectOptions: FindOptionsSelect<Video> | undefined;
    if (select && select.length > 0) {
      const selectMap: Record<string, boolean> = { id: true, createdAt: true };
      for (const field of select) {
        selectMap[field] = true;
      }
      selectOptions = selectMap;
    }

    const relationsMap: Record<string, boolean> = {
      uploader: true,
      metadata: true,
      renditions: true,
    };
    if (relations && relations.length > 0) {
      for (const rel of relations) {
        relationsMap[rel] = true;
      }
    }
    const relationsOptions = relationsMap as FindOptionsRelations<Video>;

    let whereOptions: FindOptionsWhere<Video>[] | FindOptionsWhere<Video> = {};
    if (search) {
      const baseFilter: FindOptionsWhere<Video> = {};
      if (uploaderId) baseFilter.uploaderId = uploaderId;
      if (status) baseFilter.status = status;

      whereOptions = [
        { ...baseFilter, title: ILike(`%${search}%`) },
        { ...baseFilter, description: ILike(`%${search}%`) },
      ];
    } else {
      const baseFilter: FindOptionsWhere<Video> = {};
      if (uploaderId) baseFilter.uploaderId = uploaderId;
      if (status) baseFilter.status = status;
      whereOptions = baseFilter;
    }

    const [array, count] = await this.videoRepository.findAndCount({
      select: selectOptions,
      take: limit ?? 100,
      skip: offset ?? 0,
      relations: relationsOptions,
      order: { createdAt: 'DESC' },
      where: whereOptions,
    });

    return { count, array };
  }

  async getById(id: string, query: GetVideoDto = {}): Promise<Video> {
    const { relations, select } = query;
    validateRelations(this.videoRepository, relations);

    let selectOptions: FindOptionsSelect<Video> | undefined;
    if (select && select.length > 0) {
      const selectMap: Record<string, boolean> = { id: true };
      for (const field of select) {
        selectMap[field] = true;
      }
      selectOptions = selectMap;
    }

    const relationsMap: Record<string, boolean> = {
      uploader: true,
      metadata: true,
      renditions: true,
    };
    if (relations && relations.length > 0) {
      for (const rel of relations) {
        relationsMap[rel] = true;
      }
    }
    const relationsOptions = relationsMap as FindOptionsRelations<Video>;

    const video = await this.videoRepository.findOne({
      where: { id },
      select: selectOptions,
      relations: relationsOptions,
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  async update(id: string, updateDto: UpdateVideoDto): Promise<Video> {
    const video = await this.getById(id, {});
    video.title = updateDto.title ?? video.title;
    video.description = updateDto.description ?? video.description;
    video.status = updateDto.status ?? video.status;
    return await this.videoRepository.save(video);
  }

  async findByIdWithDeleted(id: string): Promise<Video | null> {
    return this.videoRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: {
        uploader: true,
        metadata: true,
        renditions: true,
      },
    });
  }

  async delete(id: string): Promise<DeleteResult> {
    const result = await this.videoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Video not found');
    }
    return result;
  }

  // Processing Job Operations
  async createProcessingJob(
    data: Partial<VideoProcessingJob>,
  ): Promise<VideoProcessingJob> {
    const job = this.processingJobRepository.create(data);
    return await this.processingJobRepository.save(job);
  }

  async updateProcessingJob(
    id: string,
    data: Partial<VideoProcessingJob>,
  ): Promise<VideoProcessingJob> {
    await this.processingJobRepository.update(id, data);
    const updated = await this.processingJobRepository.findOne({
      where: { id },
    });
    if (!updated) {
      throw new NotFoundException(`Processing job with ID ${id} not found`);
    }
    return updated;
  }

  async getProcessingJobsByVideoId(
    videoId: string,
  ): Promise<VideoProcessingJob[]> {
    return await this.processingJobRepository.find({
      where: { videoId },
      order: { createdAt: 'DESC' },
    });
  }

  // Rendition Operations
  async createRenditions(
    renditionsData: Partial<VideoRendition>[],
  ): Promise<VideoRendition[]> {
    const renditions = this.renditionRepository.create(renditionsData);
    return await this.renditionRepository.save(renditions);
  }

  async getRenditionsByVideoId(videoId: string): Promise<VideoRendition[]> {
    return await this.renditionRepository.find({
      where: { videoId },
      order: { height: 'DESC' },
    });
  }

  async findProcessingJobById(
    id: string,
  ): Promise<VideoProcessingJob | null> {
    return await this.processingJobRepository.findOne({ where: { id } });
  }

  async updateRendition(
    id: string,
    data: Partial<VideoRendition>,
  ): Promise<VideoRendition> {
    await this.renditionRepository.update(id, data);
    const updated = await this.renditionRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException(`Rendition with ID ${id} not found`);
    }
    return updated;
  }

  async updateRenditionByProfile(
    videoId: string,
    profileKey: string,
    data: Partial<VideoRendition>,
  ): Promise<VideoRendition | null> {
    const existing = await this.renditionRepository.findOne({
      where: { videoId, profileKey },
    });
    if (existing) {
      await this.renditionRepository.update(existing.id, data);
      return await this.renditionRepository.findOne({ where: { id: existing.id } });
    }
    return null;
  }

  async updateRenditionsStatusByVideoId(
    videoId: string,
    status: RenditionStatus,
    errorMessage?: string | null,
  ): Promise<void> {
    await this.renditionRepository.update(
      { videoId },
      { status, errorMessage: errorMessage ?? null },
    );
  }
}
