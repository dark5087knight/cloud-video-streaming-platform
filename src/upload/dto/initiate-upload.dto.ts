import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class InitiateUploadDto {
  @ApiPropertyOptional({
    description: 'Existing video ID to attach upload to, if already created',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  videoId?: string;

  @ApiPropertyOptional({
    description: 'Video title (required if videoId is not provided)',
    example: '4K Aerial Nature Drone Footage',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the video',
    example: 'Ultra HD 4K footage captured in ProRes at 60fps.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'nature_cinematic.mp4',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fileName: string;

  @ApiProperty({
    description: 'Total file size in bytes',
    example: 5242880000,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSize: number;

  @ApiPropertyOptional({
    description:
      'Target chunk size in bytes (clamped between 5 MB [5242880] and 500 MB [524288000], default 10 MB [10485760])',
    example: 10485760,
    default: 10485760,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5242880) // 5 MB (AWS S3 minimum)
  @Max(524288000) // 500 MB
  partSize?: number;

  @ApiPropertyOptional({
    description: 'Video format / extension',
    example: 'mp4',
    default: 'mp4',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  format?: string;

  @ApiPropertyOptional({
    description: 'Target resolution',
    example: '4K',
    default: '1080p',
  })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional({
    description: 'Video duration in seconds',
    example: 360,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;
}
