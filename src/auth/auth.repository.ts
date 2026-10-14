import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';

@Injectable()
export class AuthRepository {
  private readonly userRepository: Repository<User>;

  constructor(private readonly dataSource: DataSource) {
    this.userRepository = this.dataSource.getRepository(User);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where(
        'LOWER(user.email) = LOWER(:email) OR LOWER(user.username) = LOWER(:username)',
        {
          email,
          username,
        },
      )
      .getOne();
  }

  async createUser(data: {
    username: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<User> {
    const user = new User();
    user.username = data.username;
    user.email = data.email;
    user.passwordHash = data.passwordHash;
    user.role = data.role ?? UserRole.USER;
    user.status = UserStatus.ACTIVE;
    return this.userRepository.save(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
