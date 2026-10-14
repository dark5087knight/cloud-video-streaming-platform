import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  ILike,
  Repository,
} from 'typeorm';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { IRepository } from '../common/interfaces/repository.interface';
import { GetAll } from '../common/interfaces/get-all.interface';
import { validateRelations } from '../common/utils/relation-validator';

@Injectable()
export class UserRepository implements IRepository<
  User,
  CreateUserDto,
  GetUserDto,
  UpdateUserDto
> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createDto: CreateUserDto & { passwordHash?: string },
  ): Promise<User> {
    const user = new User();
    user.username = createDto.username;
    user.email = createDto.email;
    user.passwordHash = createDto.passwordHash ?? createDto.password;
    user.role = createDto.role ?? user.role;
    user.status = createDto.status ?? user.status;
    return await this.userRepository.save(user);
  }

  async getAll(query: GetUserDto): Promise<GetAll<User>> {
    const { limit, offset, relations, search, select, role, status } = query;
    validateRelations(this.userRepository, relations);

    let selectOptions: FindOptionsSelect<User> | undefined;
    if (select && select.length > 0) {
      const selectMap: Record<string, boolean> = { id: true, createdAt: true };
      for (const field of select) {
        selectMap[field] = true;
      }
      selectOptions = selectMap;
    }

    let relationsOptions: FindOptionsRelations<User> | undefined;
    if (relations && relations.length > 0) {
      const relationsMap: Record<string, boolean> = {};
      for (const rel of relations) {
        relationsMap[rel] = true;
      }
      relationsOptions = relationsMap;
    }

    let whereOptions: FindOptionsWhere<User>[] | FindOptionsWhere<User> = {};
    if (search) {
      const baseFilter: FindOptionsWhere<User> = {};
      if (role) baseFilter.role = role;
      if (status) baseFilter.status = status;

      whereOptions = [
        { ...baseFilter, username: ILike(`%${search}%`) },
        { ...baseFilter, email: ILike(`%${search}%`) },
      ];
    } else {
      const baseFilter: FindOptionsWhere<User> = {};
      if (role) baseFilter.role = role;
      if (status) baseFilter.status = status;
      whereOptions = baseFilter;
    }

    const [array, count] = await this.userRepository.findAndCount({
      select: selectOptions,
      take: limit ?? 100,
      skip: offset ?? 0,
      relations: relationsOptions,
      order: { createdAt: 'ASC' },
      where: whereOptions,
    });

    return { count, array };
  }

  async getById(id: string, query: GetUserDto = {}): Promise<User> {
    const { relations, select } = query;
    validateRelations(this.userRepository, relations);

    let selectOptions: FindOptionsSelect<User> | undefined;
    if (select && select.length > 0) {
      const selectMap: Record<string, boolean> = { id: true };
      for (const field of select) {
        selectMap[field] = true;
      }
      selectOptions = selectMap;
    }

    let relationsOptions: FindOptionsRelations<User> | undefined;
    if (relations && relations.length > 0) {
      const relationsMap: Record<string, boolean> = {};
      for (const rel of relations) {
        relationsMap[rel] = true;
      }
      relationsOptions = relationsMap;
    }

    const user = await this.userRepository.findOne({
      where: { id },
      select: selectOptions,
      relations: relationsOptions,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    id: string,
    updateDto: UpdateUserDto & { passwordHash?: string },
  ): Promise<User> {
    const user = await this.getById(id, {});
    user.username = updateDto.username ?? user.username;
    user.email = updateDto.email ?? user.email;
    if (updateDto.passwordHash) {
      user.passwordHash = updateDto.passwordHash;
    }
    user.role = updateDto.role ?? user.role;
    user.status = updateDto.status ?? user.status;
    return await this.userRepository.save(user);
  }

  async delete(id: string): Promise<DeleteResult> {
    const result = await this.userRepository.softDelete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
    return result;
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<User | null> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email });

    if (includePassword) {
      queryBuilder.addSelect('user.passwordHash');
    }

    return await queryBuilder.getOne();
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }
}
