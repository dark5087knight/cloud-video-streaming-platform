import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { UploadService } from './upload.service';
import { InitiateUploadDto } from './dto/initiate-upload.dto';
import { GetPresignedPartUrlDto } from './dto/get-presigned-part-url.dto';
import { RecordPartDto } from './dto/record-part.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('videos/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('initiate')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({
    summary:
      'Initiate an S3 multipart upload session with target part size (100–500 MB)',
  })
  @ApiCreatedResponse({ description: 'Upload session initialized successfully' })
  async initiate(
    @Body() dto: InitiateUploadDto,
    @GetUser() currentUser: AuthenticatedUser,
  ) {
    return this.uploadService.initiateUpload(dto, currentUser);
  }

  @Post('presigned-part-url')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({
    summary:
      'Generate a pre-signed S3 URL for uploading a specific chunk (PartNumber 1..N)',
  })
  @ApiOkResponse({ description: 'Presigned S3 URL generated successfully' })
  async getPresignedPartUrl(
    @Body() dto: GetPresignedPartUrlDto,
    @GetUser() currentUser: AuthenticatedUser,
  ) {
    return this.uploadService.getPresignedPartUrl(dto, currentUser);
  }

  @Post('record-part')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({
    summary:
      'Record a confirmed chunk ETag into upload_parts (Concurrency-safe for 4–8 workers)',
  })
  @ApiOkResponse({ description: 'Part confirmation persisted successfully' })
  async recordPart(
    @Body() dto: RecordPartDto,
    @GetUser() currentUser: AuthenticatedUser,
  ) {
    return this.uploadService.recordPart(dto, currentUser);
  }

  @Get('status/:id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({
    summary:
      'Get upload session status, uploaded chunk ledger, and missing parts for resumption',
  })
  @ApiParam({ name: 'id', description: 'UUID of the upload session' })
  @ApiOkResponse({ description: 'Status and progress retrieved successfully' })
  async getStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() currentUser: AuthenticatedUser,
  ) {
    return this.uploadService.getUploadStatus(id, currentUser);
  }

  @Post('complete')
  @Roles('superadmin', 'admin', 'user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Finalize multipart upload on AWS S3, verify parts, and transition video status to ready',
  })
  @ApiOkResponse({ description: 'Upload assembled and completed on S3' })
  async complete(
    @Body() dto: CompleteUploadDto,
    @GetUser() currentUser: AuthenticatedUser,
  ) {
    return this.uploadService.completeUpload(dto.uploadId, currentUser);
  }

  @Delete('abort/:id')
  @Roles('superadmin', 'admin', 'user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Abort multipart upload session and free AWS S3 storage',
  })
  @ApiParam({ name: 'id', description: 'UUID of the upload session' })
  @ApiOkResponse({ description: 'Upload aborted and S3 storage freed' })
  async abort(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() currentUser: AuthenticatedUser,
  ) {
    return this.uploadService.abortUpload(id, currentUser);
  }

  @Public()
  @Get('playback/:videoId')
  @ApiOperation({
    summary:
      'Generate a time-limited secure presigned S3 playback URL for video streaming',
  })
  @ApiParam({ name: 'videoId', description: 'UUID of the video to stream' })
  @ApiOkResponse({
    description: 'Presigned S3 playback URL generated successfully',
  })
  async getPlaybackUrl(@Param('videoId', ParseUUIDPipe) videoId: string) {
    return this.uploadService.getPlaybackUrl(videoId);
  }
}
