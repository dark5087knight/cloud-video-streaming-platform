import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateVideoMetadataDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the target video record',
  })
  @IsNotEmpty()
  @IsUUID('4')
  videoId: string;

  @ApiPropertyOptional({
    example: 'videos/550e8400-e29b-41d4-a716-446655440000/original_123.mp4',
    description: 'S3 source storage key',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  sourceStorageKey?: string;

  @ApiPropertyOptional({
    example: 'mp4',
    description: 'Source format container',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  sourceFormat?: string;

  @ApiPropertyOptional({
    example: 104857600,
    description: 'Source file size in total bytes',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sourceSizeBytes?: number;

  @ApiPropertyOptional({
    example: 360.5,
    description: 'Source duration in seconds',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sourceDurationSeconds?: number | null;

  @ApiPropertyOptional({ example: 1920, description: 'Source width in pixels' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sourceWidth?: number | null;

  @ApiPropertyOptional({ example: 1080, description: 'Source height in pixels' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sourceHeight?: number | null;

  @ApiPropertyOptional({ example: 'h264', description: 'Source video codec' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceVideoCodec?: string;

  @ApiPropertyOptional({ example: 'aac', description: 'Source audio codec' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceAudioCodec?: string;

  @ApiPropertyOptional({ example: 29.97, description: 'Source frame rate' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sourceFrameRate?: number;

  // Legacy field support
  @ApiPropertyOptional({
    example: 360,
    description: 'Legacy alias: duration in seconds',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  duration?: number;

  @ApiPropertyOptional({
    example: '1080p',
    description: 'Legacy alias: display resolution',
  })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional({
    example: 'mp4',
    description: 'Legacy alias: format',
  })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({
    example: 104857600,
    description: 'Legacy alias: size in bytes',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  size?: number;
}
