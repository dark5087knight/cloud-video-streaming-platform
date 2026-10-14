import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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

export class UpdateProbedMetadataDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the target video record',
  })
  @IsNotEmpty()
  @IsUUID('4')
  videoId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the processing job',
  })
  @IsOptional()
  @IsUUID('4')
  jobId?: string;

  @ApiPropertyOptional({ example: 1920, description: 'Source video width in pixels' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sourceWidth?: number;

  @ApiPropertyOptional({ example: 1080, description: 'Source video height in pixels' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sourceHeight?: number;

  @ApiPropertyOptional({
    example: 360.54,
    description: 'Exact duration in seconds discovered via ffprobe',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sourceDurationSeconds?: number;

  @ApiPropertyOptional({ example: 'h264', description: 'Discovered video codec' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceVideoCodec?: string;

  @ApiPropertyOptional({ example: 'aac', description: 'Discovered audio codec' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceAudioCodec?: string;

  @ApiPropertyOptional({ example: 29.97, description: 'Discovered frame rate' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sourceFrameRate?: number;

  @ApiPropertyOptional({
    example: 524288000,
    description: 'Exact source file size in bytes',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sourceSizeBytes?: number;

  @ApiPropertyOptional({ example: 'mp4', description: 'Container format' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  sourceFormat?: string;
}
