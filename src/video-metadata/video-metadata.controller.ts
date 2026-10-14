import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
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

import { VideoMetadataService } from './video-metadata.service';
import { CreateVideoMetadataDto } from './dto/create-video-metadata.dto';
import { UpdateVideoMetadataDto } from './dto/update-video-metadata.dto';
import { GetVideoMetadataDto } from './dto/get-video-metadata.dto';
import { VideoMetadata } from './entities/video-metadata.entity';
import { GetAll } from '../common/interfaces/get-all.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('video-metadata')
@ApiBearerAuth()
@Controller('video-metadata')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoMetadataController {
  constructor(private readonly videoMetadataService: VideoMetadataService) {}

  @Post()
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Create metadata for a video' })
  @ApiCreatedResponse({
    description: 'Video metadata created successfully',
    type: VideoMetadata,
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async create(
    @Body() createDto: CreateVideoMetadataDto,
  ): Promise<VideoMetadata> {
    return this.videoMetadataService.create(createDto);
  }

  @Get()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get all video metadata records with pagination' })
  @ApiOkResponse({
    description: 'List retrieved successfully',
    type: [VideoMetadata],
  })
  async getAll(
    @Query() getQuery: GetVideoMetadataDto,
  ): Promise<GetAll<VideoMetadata>> {
    return this.videoMetadataService.getAll(getQuery);
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get video metadata by UUID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of metadata record',
    type: String,
  })
  @ApiOkResponse({
    description: 'Found successfully',
    type: VideoMetadata,
  })
  @ApiNotFoundResponse({ description: 'Metadata record not found' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() getQuery: GetVideoMetadataDto,
  ): Promise<VideoMetadata> {
    return this.videoMetadataService.getById(id, getQuery);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Update video metadata by UUID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of metadata record',
    type: String,
  })
  @ApiOkResponse({
    description: 'Updated successfully',
    type: VideoMetadata,
  })
  @ApiNotFoundResponse({ description: 'Metadata record not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateVideoMetadataDto,
  ): Promise<VideoMetadata> {
    return this.videoMetadataService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin', 'user')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete video metadata by UUID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of metadata record',
    type: String,
  })
  @ApiNoContentResponse({ description: 'Deleted successfully' })
  @ApiNotFoundResponse({ description: 'Metadata record not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.videoMetadataService.delete(id);
  }
}
