import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { VideoStatus } from '../entities/video.entity';

export class UpdateVideoDto {
  @ApiPropertyOptional({
    example: 'Updated Video Title',
    description: 'Updated title of the video',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim() : '',
  )
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated description content',
    description: 'Updated description of the video',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim() : '',
  )
  description?: string;

  @ApiPropertyOptional({
    enum: VideoStatus,
    description: 'Updated processing status',
  })
  @IsOptional()
  @IsEnum(VideoStatus)
  status?: VideoStatus;
}
