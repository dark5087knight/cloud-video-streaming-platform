import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';

import { Upload, UploadStatus } from './entities/upload.entity';
import { UploadPart } from './entities/upload-part.entity';
import { GetAll } from '../common/interfaces/get-all.interface';
import { GetUploadDto } from './dto/get-upload.dto';

@Injectable()
export class UploadRepository {
  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    @InjectRepository(UploadPart)
    private readonly uploadPartRepository: Repository<UploadPart>,
  ) {}

  private toRelations(relations?: string[]): FindOptionsRelations<Upload> | undefined {
    if (!relations || relations.length === 0) return undefined;
    const map: Record<string, boolean> = {};
    for (const rel of relations) {
      map[rel] = true;
    }
    return map as FindOptionsRelations<Upload>;
  }

  async create(data: {
    videoId: string;
    s3UploadId: string;
    s3Key: string;
    partSize: number;
    totalParts: number;
  }): Promise<Upload> {
    const upload = new Upload();
    upload.videoId = data.videoId;
    upload.s3UploadId = data.s3UploadId;
    upload.s3Key = data.s3Key;
    upload.partSize = data.partSize;
    upload.totalParts = data.totalParts;
    upload.status = UploadStatus.INITIATED;
    return this.uploadRepository.save(upload);
  }

  async findById(id: string): Promise<Upload> {
    const upload = await this.uploadRepository
      .createQueryBuilder('upload')
      .leftJoinAndSelect('upload.video', 'video')
      .leftJoinAndSelect('video.metadata', 'metadata')
      .leftJoinAndSelect('upload.parts', 'parts')
      .where('upload.id = :id', { id })
      .getOne();

    if (!upload) {
      throw new NotFoundException(`Upload session with ID ${id} not found`);
    }
    return upload;
  }

  async findByVideoId(videoId: string): Promise<Upload | null> {
    return this.uploadRepository.findOne({
      where: { videoId },
      relations: { video: true, parts: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findCompletedByVideoId(videoId: string): Promise<Upload | null> {
    return this.uploadRepository.findOne({
      where: { videoId, status: UploadStatus.COMPLETED },
      relations: { video: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: UploadStatus): Promise<Upload> {
    const upload = await this.findById(id);
    upload.status = status;
    return this.uploadRepository.save(upload);
  }

  async recordPart(data: {
    uploadId: string;
    partNumber: number;
    etag: string;
    size: number;
  }): Promise<UploadPart> {
    // Upsert into upload_parts table to ensure 100% concurrency safety
    let part = await this.uploadPartRepository.findOne({
      where: {
        uploadId: data.uploadId,
        partNumber: data.partNumber,
      },
    });

    if (!part) {
      part = new UploadPart();
      part.uploadId = data.uploadId;
      part.partNumber = data.partNumber;
    }

    part.etag = data.etag;
    part.size = data.size;

    return this.uploadPartRepository.save(part);
  }

  async getParts(uploadId: string): Promise<UploadPart[]> {
    return this.uploadPartRepository.find({
      where: { uploadId },
      order: { partNumber: 'ASC' },
    });
  }

  async getAll(query: GetUploadDto): Promise<GetAll<Upload>> {
    const { limit, offset, videoId, status } = query;
    const queryBuilder = this.uploadRepository
      .createQueryBuilder('upload')
      .leftJoinAndSelect('upload.video', 'video')
      .leftJoinAndSelect('upload.parts', 'parts')
      .take(limit ?? 100)
      .skip(offset ?? 0)
      .orderBy('upload.createdAt', 'DESC');

    if (videoId) {
      queryBuilder.andWhere('upload.videoId = :videoId', { videoId });
    }
    if (status) {
      queryBuilder.andWhere('upload.status = :status', { status });
    }

    const [array, count] = await queryBuilder.getManyAndCount();
    return { count, array };
  }

  async delete(id: string): Promise<void> {
    const result = await this.uploadRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Upload session with ID ${id} not found`);
    }
  }
}
