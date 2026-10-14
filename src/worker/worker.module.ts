import { Module } from '@nestjs/common';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import { WorkerApiKeyGuard } from './guards/worker-api-key.guard';
import { VideoModule } from '../video/video.module';
import { VideoMetadataModule } from '../video-metadata/video-metadata.module';

@Module({
  imports: [VideoModule, VideoMetadataModule],
  controllers: [WorkerController],
  providers: [WorkerService, WorkerApiKeyGuard],
  exports: [WorkerService],
})
export class WorkerModule {}
