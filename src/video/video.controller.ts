import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  forwardRef,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { GetVideoDto } from './dto/get-video.dto';
import { Video } from './entities/video.entity';
import { GetAll } from '../common/interfaces/get-all.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserRole } from '../user/entities/user.entity';
import { UploadService } from '../upload/upload.service';

@ApiTags('videos')
@ApiBearerAuth()
@Controller('videos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    @Inject(forwardRef(() => UploadService))
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Create / Upload a new video' })
  @ApiCreatedResponse({
    description: 'Video created successfully',
    type: Video,
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async create(
    @Body() createDto: CreateVideoDto,
    @GetUser() currentUser: AuthenticatedUser,
  ): Promise<Video> {
    // If standard user, enforce uploaderId as the current user
    if (currentUser.role === UserRole.USER || !createDto.uploaderId) {
      createDto.uploaderId = currentUser.id;
    }
    return this.videoService.create(createDto);
  }

  @Get()
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get all videos with pagination and filters' })
  @ApiOkResponse({ description: 'List retrieved successfully', type: [Video] })
  async getAll(@Query() getQuery: GetVideoDto): Promise<GetAll<Video>> {
    return this.videoService.getAll(getQuery);
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get video by UUID' })
  @ApiParam({ name: 'id', description: 'UUID of the video', type: String })
  @ApiOkResponse({ description: 'Found successfully', type: Video })
  @ApiNotFoundResponse({ description: 'Video not found' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() getQuery: GetVideoDto,
  ): Promise<Video> {
    return this.videoService.getById(id, getQuery);
  }

  @Public()
  @Get(':id/playback')
  @ApiOperation({
    summary:
      'Generate time-limited secure presigned S3 playback URL for video streaming',
  })
  @ApiParam({ name: 'id', description: 'UUID of the video to stream' })
  @ApiOkResponse({
    description: 'Presigned S3 playback URL generated successfully',
  })
  @ApiNotFoundResponse({ description: 'Video or S3 media asset not found' })
  async getPlaybackUrl(@Param('id', ParseUUIDPipe) id: string) {
    return this.uploadService.getPlaybackUrl(id);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Update video by UUID' })
  @ApiParam({ name: 'id', description: 'UUID of the video', type: String })
  @ApiOkResponse({ description: 'Updated successfully', type: Video })
  @ApiNotFoundResponse({ description: 'Video not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateVideoDto,
    @GetUser() currentUser: AuthenticatedUser,
  ): Promise<Video> {
    if (currentUser.role === UserRole.USER) {
      const existing = await this.videoService.getById(id);
      if (existing.uploaderId !== currentUser.id) {
        throw new ForbiddenException(
          'Cannot edit videos uploaded by other users',
        );
      }
    }
    return this.videoService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin', 'user')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Permanently delete video from PostgreSQL database and AWS S3 storage',
  })
  @ApiParam({ name: 'id', description: 'UUID of the video', type: String })
  @ApiNoContentResponse({ description: 'Deleted successfully' })
  @ApiNotFoundResponse({ description: 'Video not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    if (currentUser.role === UserRole.USER) {
      const existing = await this.videoService.getById(id);
      if (existing.uploaderId !== currentUser.id) {
        throw new ForbiddenException(
          'Cannot delete videos uploaded by other users',
        );
      }
    }
    return this.videoService.delete(id);
  }
}
