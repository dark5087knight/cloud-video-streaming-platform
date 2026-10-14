import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Video } from './video.entity';

export enum RenditionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('video_renditions')
@Unique('uq_video_rendition_profile', ['videoId', 'profileKey'])
export class VideoRendition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'video_id', type: 'uuid', nullable: false })
  @Index()
  videoId: string;

  @ManyToOne(() => Video, (video) => video.renditions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({ name: 'profile_key', type: 'varchar', length: 100, nullable: false })
  profileKey: string;

  @Column({ type: 'integer', nullable: false })
  width: number;

  @Column({ type: 'integer', nullable: false })
  @Index('idx_renditions_video_height')
  height: number;

  @Column({ name: 'video_codec', type: 'varchar', length: 50, nullable: false })
  videoCodec: string;

  @Column({ name: 'audio_codec', type: 'varchar', length: 50, nullable: true })
  audioCodec: string | null;

  @Column({
    name: 'video_bitrate_bps',
    type: 'bigint',
    nullable: true,
  })
  videoBitrateBps: number | null;

  @Column({
    name: 'audio_bitrate_bps',
    type: 'bigint',
    nullable: true,
  })
  audioBitrateBps: number | null;

  @Column({
    name: 'file_size_bytes',
    type: 'bigint',
    nullable: true,
  })
  fileSizeBytes: number | null;

  @Column({
    name: 'duration_seconds',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  durationSeconds: number | null;

  @Column({ name: 'storage_key', type: 'varchar', length: 1024, nullable: false })
  storageKey: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: RenditionStatus.PENDING,
    nullable: false,
  })
  @Index('idx_renditions_video_status')
  status: RenditionStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
