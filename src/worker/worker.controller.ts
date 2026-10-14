import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { WorkerService } from './worker.service';
import { WorkerApiKeyGuard } from './guards/worker-api-key.guard';
import { StartJobDto } from './dto/start-job.dto';
import { UpdateProbedMetadataDto } from './dto/update-probed-metadata.dto';
import { CompleteJobDto } from './dto/complete-job.dto';
import { FailJobDto } from './dto/fail-job.dto';
import { JobProgressDto } from './dto/job-progress.dto';

@ApiTags('worker')
@ApiHeader({
  name: 'x-api-key',
  description: 'Internal worker API key for authentication',
  required: true,
})
@Controller('worker')
@UseGuards(WorkerApiKeyGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: false,
    forbidNonWhitelisted: false,
  }),
)
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post('job/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Notify backend that worker claimed and started processing a job',
  })
  @ApiOkResponse({ description: 'Job state set to processing' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API key' })
  async startJob(@Body() dto: StartJobDto) {
    return this.workerService.startJob(dto);
  }

  @Post('video/metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update video technical metadata after ffprobe analysis',
  })
  @ApiOkResponse({ description: 'Video metadata synchronized successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API key' })
  async updateMetadata(@Body() dto: UpdateProbedMetadataDto) {
    return this.workerService.updateMetadata(dto);
  }

  @Post('job/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Report live transcoding progress percentage from worker',
  })
  @ApiOkResponse({ description: 'Progress recorded successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API key' })
  async updateProgress(@Body() dto: JobProgressDto) {
    return this.workerService.updateProgress(dto);
  }

  @Post('job/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Notify backend that all renditions completed and S3 upload finished',
  })
  @ApiOkResponse({
    description: 'Video status transitioned to ready, job completed',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API key' })
  async completeJob(@Body() dto: CompleteJobDto) {
    return this.workerService.completeJob(dto);
  }

  @Post('job/fail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Notify backend that video transcoding failed with an error',
  })
  @ApiOkResponse({ description: 'Job and video marked as failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API key' })
  async failJob(@Body() dto: FailJobDto) {
    return this.workerService.failJob(dto);
  }
}
