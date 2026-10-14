import { Column, Entity, Index, OneToMany } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Video } from '../../video/entities/video.entity';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DISABLED = 'disabled',
}

@Entity('users')
export class User extends CoreEntity {
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  @Index({ unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  @Index({ unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false, select: false })
  passwordHash: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.USER,
    nullable: false,
  })
  role: UserRole;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserStatus.ACTIVE,
    nullable: false,
  })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @OneToMany(() => Video, (video) => video.uploader)
  videos: Video[];
}
