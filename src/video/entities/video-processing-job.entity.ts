import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Video } from './video.entity';

export enum ProcessingJobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ProcessingJobType {
  TRANSCODE = 'transcode',
  PROBE = 'probe',
  THUMBNAIL = 'thumbnail',
}

@Entity('video_processing_jobs')
export class VideoProcessingJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'video_id', type: 'uuid', nullable: false })
  @Index('idx_jobs_video_created')
  videoId: string;

  @ManyToOne(() => Video, (video) => video.processingJobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({
    name: 'job_type',
    type: 'varchar',
    length: 30,
    default: ProcessingJobType.TRANSCODE,
    nullable: false,
  })
  jobType: ProcessingJobType;

  @Column({
    type: 'varchar',
    length: 20,
    default: ProcessingJobStatus.QUEUED,
    nullable: false,
  })
  @Index('idx_jobs_status_available')
  status: ProcessingJobStatus;

  @Column({ name: 'attempt_count', type: 'integer', default: 0, nullable: false })
  attemptCount: number;

  @Column({ name: 'max_attempts', type: 'integer', default: 3, nullable: false })
  maxAttempts: number;

  @Column({
    name: 'queue_message_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Index('idx_jobs_queue_message')
  queueMessageId: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({
    name: 'available_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  availableAt: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
