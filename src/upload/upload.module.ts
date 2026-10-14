import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { UploadRepository } from './upload.repository';
import { Upload } from './entities/upload.entity';
import { UploadPart } from './entities/upload-part.entity';
import { VideoModule } from '../video/video.module';
import { VideoMetadataModule } from '../video-metadata/video-metadata.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Upload, UploadPart]),
    forwardRef(() => VideoModule),
    VideoMetadataModule,
  ],
  controllers: [UploadController],
  providers: [UploadService, UploadRepository],
  exports: [UploadService], // Export ONLY Service per module policy
})
export class UploadModule {}
