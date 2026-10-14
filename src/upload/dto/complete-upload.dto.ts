import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CompleteUploadDto {
  @ApiProperty({
    description: 'ID of the upload session to finalize and assemble on S3',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  uploadId: string;
}
