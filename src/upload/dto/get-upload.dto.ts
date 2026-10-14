import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OffsetLimitDto } from '../../common/dto/offset-limit.dto';
import { UploadStatus } from '../entities/upload.entity';

export class GetUploadDto extends OffsetLimitDto {
  @ApiPropertyOptional({
    description: 'Filter upload sessions by video ID',
  })
  @IsOptional()
  @IsUUID('4')
  videoId?: string;

  @ApiPropertyOptional({
    description: 'Filter upload sessions by status',
    enum: UploadStatus,
  })
  @IsOptional()
  @IsEnum(UploadStatus)
  status?: UploadStatus;

  @ApiPropertyOptional({
    type: [String],
    description: 'Entity relations to load (e.g. video, parts)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? (value as string[]) : [String(value)],
  )
  @IsArray()
  @IsString({ each: true })
  relations?: string[];
}
