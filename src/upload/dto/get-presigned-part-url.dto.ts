import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class GetPresignedPartUrlDto {
  @ApiProperty({
    description: 'ID of the active upload session',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  uploadId: string;

  @ApiProperty({
    description: 'Part number index to generate signed PUT URL for (1-based)',
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partNumber: number;
}
