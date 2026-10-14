import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class StartJobDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the video processing job',
  })
  @IsNotEmpty()
  @IsUUID('4')
  jobId: string;

  @ApiPropertyOptional({
    example: 'worker-node-01',
    description: 'Identifier of the worker instance picking up the task',
  })
  @IsOptional()
  @IsString()
  workerId?: string;
}
