import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class RecordPartDto {
  @ApiProperty({
    description: 'ID of the active upload session',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  uploadId: string;

  @ApiProperty({
    description: 'Part number index (1-based)',
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partNumber: number;

  @ApiProperty({
    description: 'ETag hash returned by S3 upon chunk PUT completion',
    example: '"b10a8db164e0754105b7a99be72e3fe5"',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  etag: string;

  @ApiProperty({
    description: 'Chunk size in bytes actually uploaded',
    example: 104857600,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size: number;
}
