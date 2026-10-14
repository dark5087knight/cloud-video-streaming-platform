import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Video } from '../../video/entities/video.entity';

@Entity('video_metadata')
export class VideoMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'video_id', type: 'uuid', unique: true, nullable: false })
  @Index('idx_video_metadata_video_id')
  videoId: string;

  @OneToOne(() => Video, (video) => video.metadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({
    name: 'source_storage_key',
    type: 'varchar',
    length: 1024,
    nullable: false,
  })
  sourceStorageKey: string;

  @Column({
    name: 'source_format',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  sourceFormat: string | null;

  @Column({
    name: 'source_size_bytes',
    type: 'bigint',
    nullable: true,
  })
  sourceSizeBytes: number | null;

  @Column({
    name: 'source_duration_seconds',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  sourceDurationSeconds: number | null;

  @Column({
    name: 'source_width',
    type: 'integer',
    nullable: true,
  })
  sourceWidth: number | null;

  @Column({
    name: 'source_height',
    type: 'integer',
    nullable: true,
  })
  sourceHeight: number | null;

  @Column({
    name: 'source_video_codec',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  sourceVideoCodec: string | null;

  @Column({
    name: 'source_audio_codec',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  sourceAudioCodec: string | null;

  @Column({
    name: 'source_frame_rate',
    type: 'decimal',
    precision: 8,
    scale: 3,
    nullable: true,
  })
  sourceFrameRate: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Compatibility accessors for legacy code / DTOs
  get size(): number | null {
    return this.sourceSizeBytes ? Number(this.sourceSizeBytes) : null;
  }

  get format(): string | null {
    return this.sourceFormat;
  }

  get duration(): number | null {
    return this.sourceDurationSeconds
      ? Math.round(Number(this.sourceDurationSeconds))
      : null;
  }

  get resolution(): string | null {
    return this.sourceHeight ? `${this.sourceHeight}p` : null;
  }
}
