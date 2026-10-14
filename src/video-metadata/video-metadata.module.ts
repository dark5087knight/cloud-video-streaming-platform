import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VideoMetadataController } from './video-metadata.controller';
import { VideoMetadataService } from './video-metadata.service';
import { VideoMetadataRepository } from './video-metadata.repository';
import { VideoMetadata } from './entities/video-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VideoMetadata])],
  controllers: [VideoMetadataController],
  providers: [VideoMetadataService, VideoMetadataRepository],
  exports: [VideoMetadataService], // Export ONLY the Service (Repository is private)
})
export class VideoMetadataModule {}
