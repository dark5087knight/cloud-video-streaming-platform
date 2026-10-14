import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.authRepository.findByEmailOrUsername(
      registerDto.email,
      registerDto.username,
    );
    if (existing) {
      if (existing.email.toLowerCase() === registerDto.email.toLowerCase()) {
        throw new ConflictException('Email already in use');
      }
      throw new ConflictException('Username already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.authRepository.createUser({
      username: registerDto.username,
      email: registerDto.email,
      passwordHash,
      role: UserRole.USER,
    });

    const userCopy = { ...user };
    delete (userCopy as Partial<User>).passwordHash;
    return userCopy;
  }

  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    user: {
      id: string;
      email: string;
      username: string;
      role: UserRole;
      status: UserStatus;
    };
  }> {
    const user = await this.authRepository.findByEmailWithPassword(
      loginDto.email,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended');
    }
    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException('Account is disabled');
    }

    await this.authRepository.updateLastLogin(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    };
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
