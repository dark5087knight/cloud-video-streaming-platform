import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class FailJobDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the processing job',
  })
  @IsNotEmpty()
  @IsUUID('4')
  jobId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the video record',
  })
  @IsNotEmpty()
  @IsUUID('4')
  videoId: string;

  @ApiProperty({
    example: 'FFmpeg transcode failed: Non-monotonous DTS in output stream',
    description: 'Detailed error message from transcoder or probe tool',
  })
  @IsNotEmpty()
  @IsString()
  errorMessage: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the error is retryable',
  })
  @IsOptional()
  @IsBoolean()
  canRetry?: boolean;
}
