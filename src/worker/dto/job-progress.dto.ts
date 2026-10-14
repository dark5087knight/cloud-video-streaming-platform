import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class JobProgressDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the processing job',
  })
  @IsNotEmpty()
  @IsUUID('4')
  jobId: string;

  @ApiProperty({
    example: 45,
    description: 'Progress percentage (0-100)',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  percent: number;

  @ApiPropertyOptional({
    example: 'Encoding 720p rendition',
    description: 'Current processing stage description',
  })
  @IsOptional()
  @IsString()
  stage?: string;
}
