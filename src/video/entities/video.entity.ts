import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { User } from '../../user/entities/user.entity';
import { VideoMetadata } from '../../video-metadata/entities/video-metadata.entity';
import { VideoRendition } from './video-rendition.entity';
import { VideoProcessingJob } from './video-processing-job.entity';

export enum VideoStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

export enum VideoVisibility {
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  PUBLIC = 'public',
}

@Entity('videos')
@Index('idx_videos_uploader_created', ['uploaderId', 'createdAt'])
@Index('idx_videos_status_created', ['status', 'createdAt'])
export class Video extends CoreEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'uploader_id', type: 'uuid', nullable: false })
  uploaderId: string;

  @ManyToOne(() => User, (user) => user.videos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @Column({
    type: 'varchar',
    length: 20,
    default: VideoStatus.UPLOADED,
    nullable: false,
  })
  status: VideoStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: VideoVisibility.PRIVATE,
    nullable: false,
  })
  visibility: VideoVisibility;

  @OneToOne(() => VideoMetadata, (metadata) => metadata.video, {
    cascade: true,
  })
  metadata: VideoMetadata | null;

  @OneToMany(() => VideoRendition, (rendition) => rendition.video)
  renditions: VideoRendition[];

  @OneToMany(() => VideoProcessingJob, (job) => job.video)
  processingJobs: VideoProcessingJob[];
}
