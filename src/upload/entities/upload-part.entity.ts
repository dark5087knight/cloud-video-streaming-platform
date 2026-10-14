import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Upload } from './upload.entity';

@Entity('upload_parts')
@Index(['uploadId', 'partNumber'], { unique: true })
export class UploadPart extends CoreEntity {
  @Column({ name: 'upload_id', type: 'uuid', nullable: false })
  @Index()
  uploadId: string;

  @ManyToOne(() => Upload, (upload) => upload.parts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'upload_id' })
  upload: Upload;

  @Column({ name: 'part_number', type: 'integer', nullable: false })
  partNumber: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  etag: string;

  @Column({ type: 'bigint', nullable: false })
  size: number;
}
