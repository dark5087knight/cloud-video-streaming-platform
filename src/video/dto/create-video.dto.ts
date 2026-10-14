import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { VideoStatus } from '../entities/video.entity';

export class CreateVideoDto {
  @ApiProperty({
    example: 'Introduction to NestJS',
    description: 'Title of the video',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim() : '',
  )
  title: string;

  @ApiPropertyOptional({
    example: 'A comprehensive beginner guide to building scalable NestJS APIs',
    description: 'Detailed description of the video',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim() : '',
  )
  description?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'UUID of the uploader (Admin/Superadmin only; defaults to authenticated user)',
  })
  @IsOptional()
  @IsUUID('4')
  uploaderId?: string;

  @ApiPropertyOptional({
    enum: VideoStatus,
    default: VideoStatus.PROCESSING,
    description: 'Current processing status of the video',
  })
  @IsOptional()
  @IsEnum(VideoStatus)
  status?: VideoStatus = VideoStatus.PROCESSING;
}
