import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Video } from '../../video/entities/video.entity';
import { UploadPart } from './upload-part.entity';

export enum UploadStatus {
  INITIATED = 'initiated',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  ABORTED = 'aborted',
}

@Entity('uploads')
export class Upload extends CoreEntity {
  @Column({ name: 'video_id', type: 'uuid', nullable: false })
  @Index()
  videoId: string;

  @ManyToOne(() => Video, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({ name: 's3_upload_id', type: 'varchar', length: 255, nullable: false })
  s3UploadId: string;

  @Column({ name: 's3_key', type: 'varchar', length: 512, nullable: false })
  s3Key: string;

  @Column({ name: 'part_size', type: 'integer', nullable: false })
  partSize: number; // In bytes (100 MB to 500 MB)

  @Column({ name: 'total_parts', type: 'integer', nullable: false })
  totalParts: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: UploadStatus.INITIATED,
    nullable: false,
  })
  @Index()
  status: UploadStatus;

  @OneToMany(() => UploadPart, (part) => part.upload, { cascade: true })
  parts: UploadPart[];
}
