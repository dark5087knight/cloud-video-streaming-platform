import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { OffsetLimitDto } from '../../common/dto/offset-limit.dto';

export class GetVideoMetadataDto extends OffsetLimitDto {
  @ApiPropertyOptional({
    description: 'Search query across resolution or format',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  search?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Relations to load (e.g. video)',
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
    description: 'Filter metadata by associated video UUID',
  })
  @IsOptional()
  @IsUUID('4')
  videoId?: string;
}
