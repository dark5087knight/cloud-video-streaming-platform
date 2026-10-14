import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OffsetLimitDto } from '../../common/dto/offset-limit.dto';
import { VideoStatus } from '../entities/video.entity';

export class GetVideoDto extends OffsetLimitDto {
  @ApiPropertyOptional({
    description: 'Search query across video title or description',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  search?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Relations to load (e.g. uploader, metadata)',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
      return [value];
    }
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  relations?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Specific fields to select from the entity',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
      return [value];
    }
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  select?: string[];

  @ApiPropertyOptional({
    description: 'Filter videos by uploader UUID',
  })
  @IsOptional()
  @IsUUID('4')
  uploaderId?: string;

  @ApiPropertyOptional({
    enum: VideoStatus,
    description: 'Filter videos by status',
  })
  @IsOptional()
  @IsEnum(VideoStatus)
  status?: VideoStatus;
}
