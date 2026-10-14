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

import { VideoMetadata } from './entities/video-metadata.entity';
import { CreateVideoMetadataDto } from './dto/create-video-metadata.dto';
import { UpdateVideoMetadataDto } from './dto/update-video-metadata.dto';
import { GetVideoMetadataDto } from './dto/get-video-metadata.dto';
import { IRepository } from '../common/interfaces/repository.interface';
import { GetAll } from '../common/interfaces/get-all.interface';
import { validateRelations } from '../common/utils/relation-validator';

@Injectable()
export class VideoMetadataRepository implements IRepository<
  VideoMetadata,
  CreateVideoMetadataDto,
  GetVideoMetadataDto,
  UpdateVideoMetadataDto
> {
  constructor(
    @InjectRepository(VideoMetadata)
    private readonly videoMetadataRepository: Repository<VideoMetadata>,
  ) {}

  async create(createDto: CreateVideoMetadataDto): Promise<VideoMetadata> {
    const metadata = new VideoMetadata();
    metadata.videoId = createDto.videoId;
    metadata.sourceStorageKey =
      createDto.sourceStorageKey ?? `videos/${createDto.videoId}/original.mp4`;
    metadata.sourceFormat = createDto.sourceFormat ?? createDto.format ?? 'mp4';
    metadata.sourceSizeBytes =
      createDto.sourceSizeBytes ??
      (createDto.size !== undefined ? Number(createDto.size) : null);
    metadata.sourceDurationSeconds =
      createDto.sourceDurationSeconds ??
      (createDto.duration !== undefined ? Number(createDto.duration) : null);
    metadata.sourceWidth = createDto.sourceWidth ?? null;
    metadata.sourceHeight =
      createDto.sourceHeight ??
      (createDto.resolution?.includes('1080')
        ? 1080
        : createDto.resolution?.includes('720')
        ? 720
        : null);
    metadata.sourceVideoCodec = createDto.sourceVideoCodec ?? null;
    metadata.sourceAudioCodec = createDto.sourceAudioCodec ?? null;
    metadata.sourceFrameRate = createDto.sourceFrameRate ?? null;

    return await this.videoMetadataRepository.save(metadata);
  }

  async getAll(query: GetVideoMetadataDto): Promise<GetAll<VideoMetadata>> {
    const { limit, offset, relations, search, select, videoId } = query;
    validateRelations(this.videoMetadataRepository, relations);

    let selectOptions: FindOptionsSelect<VideoMetadata> | undefined;
    if (select && select.length > 0) {
      const selectMap: Record<string, boolean> = { id: true, createdAt: true };
      for (const field of select) {
        selectMap[field] = true;
      }
      selectOptions = selectMap;
    }

    let relationsOptions: FindOptionsRelations<VideoMetadata> | undefined;
    if (relations && relations.length > 0) {
      const relationsMap: Record<string, boolean> = {};
      for (const rel of relations) {
        relationsMap[rel] = true;
      }
      relationsOptions = relationsMap;
    }

    let whereOptions:
      FindOptionsWhere<VideoMetadata>[] | FindOptionsWhere<VideoMetadata> = {};
    if (search) {
      const baseFilter: FindOptionsWhere<VideoMetadata> = {};
      if (videoId) baseFilter.videoId = videoId;

      whereOptions = [
        { ...baseFilter, sourceFormat: ILike(`%${search}%`) },
        { ...baseFilter, sourceStorageKey: ILike(`%${search}%`) },
      ];
    } else {
      const baseFilter: FindOptionsWhere<VideoMetadata> = {};
      if (videoId) baseFilter.videoId = videoId;
      whereOptions = baseFilter;
    }

    const [array, count] = await this.videoMetadataRepository.findAndCount({
      select: selectOptions,
      take: limit ?? 100,
      skip: offset ?? 0,
      relations: relationsOptions,
      order: { createdAt: 'ASC' },
      where: whereOptions,
    });

    return { count, array };
  }

  async getById(
    id: string,
    query: GetVideoMetadataDto = {},
  ): Promise<VideoMetadata> {
    const { relations, select } = query;
    validateRelations(this.videoMetadataRepository, relations);

    let selectOptions: FindOptionsSelect<VideoMetadata> | undefined;
    if (select && select.length > 0) {
      const selectMap: Record<string, boolean> = { id: true };
      for (const field of select) {
        selectMap[field] = true;
      }
      selectOptions = selectMap;
    }

    let relationsOptions: FindOptionsRelations<VideoMetadata> | undefined;
    if (relations && relations.length > 0) {
      const relationsMap: Record<string, boolean> = {};
      for (const rel of relations) {
        relationsMap[rel] = true;
      }
      relationsOptions = relationsMap;
    }

    const metadata = await this.videoMetadataRepository.findOne({
      where: { id },
      select: selectOptions,
      relations: relationsOptions,
    });

    if (!metadata) {
      throw new NotFoundException('Video metadata not found');
    }

    return metadata;
  }

  async update(
    id: string,
    updateDto: UpdateVideoMetadataDto,
  ): Promise<VideoMetadata> {
    const metadata = await this.getById(id, {});

    if (updateDto.sourceStorageKey !== undefined) {
      metadata.sourceStorageKey = updateDto.sourceStorageKey;
    }
    if (updateDto.sourceFormat !== undefined || updateDto.format !== undefined) {
      metadata.sourceFormat = updateDto.sourceFormat ?? updateDto.format ?? null;
    }
    if (updateDto.sourceSizeBytes !== undefined || updateDto.size !== undefined) {
      metadata.sourceSizeBytes =
        updateDto.sourceSizeBytes ??
        (updateDto.size !== undefined ? Number(updateDto.size) : null);
    }
    if (
      updateDto.sourceDurationSeconds !== undefined ||
      updateDto.duration !== undefined
    ) {
      metadata.sourceDurationSeconds =
        updateDto.sourceDurationSeconds ??
        (updateDto.duration !== undefined ? Number(updateDto.duration) : null);
    }
    if (updateDto.sourceWidth !== undefined) {
      metadata.sourceWidth = updateDto.sourceWidth;
    }
    if (updateDto.sourceHeight !== undefined) {
      metadata.sourceHeight = updateDto.sourceHeight;
    } else if (updateDto.resolution !== undefined) {
      metadata.sourceHeight = updateDto.resolution.includes('1080')
        ? 1080
        : updateDto.resolution.includes('720')
        ? 720
        : null;
    }
    if (updateDto.sourceVideoCodec !== undefined) {
      metadata.sourceVideoCodec = updateDto.sourceVideoCodec;
    }
    if (updateDto.sourceAudioCodec !== undefined) {
      metadata.sourceAudioCodec = updateDto.sourceAudioCodec;
    }
    if (updateDto.sourceFrameRate !== undefined) {
      metadata.sourceFrameRate = updateDto.sourceFrameRate;
    }

    return await this.videoMetadataRepository.save(metadata);
  }

  async delete(id: string): Promise<DeleteResult> {
    const result = await this.videoMetadataRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Video metadata not found');
    }
    return result;
  }

  async findByVideoId(videoId: string): Promise<VideoMetadata | null> {
    return this.videoMetadataRepository.findOne({ where: { videoId } });
  }
}
