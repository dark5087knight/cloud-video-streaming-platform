import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { UserRepository } from './user.repository';
import { GetAll } from '../common/interfaces/get-all.interface';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const existingEmail = await this.userRepository.findByEmail(
      registerDto.email,
    );
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.userRepository.findByUsername(
      registerDto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
      passwordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });

    const userCopy = { ...user };
    delete (userCopy as Partial<User>).passwordHash;
    return userCopy;
  }

  async create(createDto: CreateUserDto): Promise<User> {
    const existingEmail = await this.userRepository.findByEmail(
      createDto.email,
    );
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.userRepository.findByUsername(
      createDto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createDto.password, salt);

    return this.userRepository.create({
      ...createDto,
      passwordHash,
    });
  }

  async getAll(query: GetUserDto): Promise<GetAll<User>> {
    return this.userRepository.getAll(query);
  }

  async getById(id: string, query?: GetUserDto): Promise<User> {
    return this.userRepository.getById(id, query ?? {});
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    if (updateDto.email) {
      const existingEmail = await this.userRepository.findByEmail(
        updateDto.email,
      );
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateDto.username) {
      const existingUsername = await this.userRepository.findByUsername(
        updateDto.username,
      );
      if (existingUsername && existingUsername.id !== id) {
        throw new ConflictException('Username already in use');
      }
    }

    let passwordHash: string | undefined;
    if (updateDto.password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(updateDto.password, salt);
    }

    return this.userRepository.update(id, {
      ...updateDto,
      passwordHash,
    });
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<User | null> {
    return this.userRepository.findByEmail(email, includePassword);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.updateLastLogin(id);
  }
}
