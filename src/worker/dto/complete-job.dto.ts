import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RenditionResultDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the rendition record in database',
  })
  @IsOptional()
  @IsUUID('4')
  renditionId?: string | null;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  rendition_id?: string | null;

  @ApiPropertyOptional({
    example: 'hls_720p_h264',
    description: 'Profile key of the rendition',
  })
  @IsOptional()
  @IsString()
  profileKey?: string;

  @ApiPropertyOptional({
    example: 'hls_720p_h264',
  })
  @IsOptional()
  @IsString()
  profile_key?: string;

  @ApiPropertyOptional({
    example: 'hls_720p_h264',
  })
  @IsOptional()
  @IsString()
  profile?: string;

  @ApiPropertyOptional({
    example: 15420000,
    description: 'Total file size of all segments in bytes',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fileSizeBytes?: number;

  @ApiPropertyOptional({
    example: 15420000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  file_size_bytes?: number;

  @ApiPropertyOptional({
    example: 15420000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  size_bytes?: number;

  @ApiPropertyOptional({
    example: 15420000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({
    example: 360.5,
    description: 'Actual encoded duration in seconds',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  durationSeconds?: number;

  @ApiPropertyOptional({
    example: 360.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration_seconds?: number;

  @ApiPropertyOptional({
    example: 360.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({
    example: 'videos/uuid/renditions/720p/playlist.m3u8',
    description: 'S3 key of this rendition playlist',
  })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiPropertyOptional({
    example: 'videos/uuid/renditions/720p/playlist.m3u8',
  })
  @IsOptional()
  @IsString()
  storage_key?: string;

  @ApiPropertyOptional({
    example: 'videos/uuid/renditions/720p/playlist.m3u8',
  })
  @IsOptional()
  @IsString()
  key?: string;
}

export class CompleteJobDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the processing job (camelCase)',
  })
  @IsOptional()
  @IsUUID('4')
  jobId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the processing job (snake_case)',
  })
  @IsOptional()
  @IsUUID('4')
  job_id?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the video record (camelCase)',
  })
  @IsOptional()
  @IsUUID('4')
  videoId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the video record (snake_case)',
  })
  @IsOptional()
  @IsUUID('4')
  video_id?: string;

  @ApiPropertyOptional({
    type: [RenditionResultDto],
    description: 'List of completed rendition output specs',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RenditionResultDto)
  renditions?: RenditionResultDto[];

  @ApiPropertyOptional({
    example: 'videos/uuid/master.m3u8',
    description: 'S3 key for the master adaptive HLS playlist',
  })
  @IsOptional()
  @IsString()
  masterPlaylistKey?: string | null;

  @ApiPropertyOptional({
    example: 'videos/uuid/master.m3u8',
  })
  @IsOptional()
  @IsString()
  master_key?: string | null;

  @ApiPropertyOptional({
    example: 'videos/uuid/thumbnail.jpg',
    description: 'Optional S3 key for poster thumbnail (not required)',
  })
  @IsOptional()
  @IsString()
  thumbnailKey?: string | null;

  @ApiPropertyOptional({
    example: 'videos/uuid/thumbnail.jpg',
  })
  @IsOptional()
  @IsString()
  thumb_key?: string | null;

  @ApiPropertyOptional({
    example: 'videos/uuid/thumbnail.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnail_key?: string | null;
}
