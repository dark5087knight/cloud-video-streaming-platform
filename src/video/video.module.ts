import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { VideoRepository } from './video.repository';
import { Video } from './entities/video.entity';
import { VideoRendition } from './entities/video-rendition.entity';
import { VideoProcessingJob } from './entities/video-processing-job.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, VideoRendition, VideoProcessingJob]),
    forwardRef(() => UploadModule),
  ],
  controllers: [VideoController],
  providers: [VideoService, VideoRepository],
  exports: [VideoService],
})
export class VideoModule {}
