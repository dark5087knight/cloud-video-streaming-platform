import { ConflictException, Injectable } from '@nestjs/common';
import { VideoMetadata } from './entities/video-metadata.entity';
import { CreateVideoMetadataDto } from './dto/create-video-metadata.dto';
import { UpdateVideoMetadataDto } from './dto/update-video-metadata.dto';
import { GetVideoMetadataDto } from './dto/get-video-metadata.dto';
import { VideoMetadataRepository } from './video-metadata.repository';
import { GetAll } from '../common/interfaces/get-all.interface';

@Injectable()
export class VideoMetadataService {
  constructor(
    private readonly videoMetadataRepository: VideoMetadataRepository,
  ) {}

  async create(createDto: CreateVideoMetadataDto): Promise<VideoMetadata> {
    const existing = await this.videoMetadataRepository.findByVideoId(
      createDto.videoId,
    );
    if (existing) {
      throw new ConflictException(
        'Metadata record already exists for this video',
      );
    }
    return this.videoMetadataRepository.create(createDto);
  }

  async getAll(getQuery: GetVideoMetadataDto): Promise<GetAll<VideoMetadata>> {
    return this.videoMetadataRepository.getAll(getQuery);
  }

  async getById(
    id: string,
    getQuery?: GetVideoMetadataDto,
  ): Promise<VideoMetadata> {
    return this.videoMetadataRepository.getById(id, getQuery ?? {});
  }

  async update(
    id: string,
    updateDto: UpdateVideoMetadataDto,
  ): Promise<VideoMetadata> {
    return this.videoMetadataRepository.update(id, updateDto);
  }

  async delete(id: string): Promise<void> {
    await this.videoMetadataRepository.delete(id);
  }

  async findByVideoId(videoId: string): Promise<VideoMetadata | null> {
    return this.videoMetadataRepository.findByVideoId(videoId);
  }
}
