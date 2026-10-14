import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { User, UserStatus } from '../../user/entities/user.entity';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../interfaces/authenticated-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload || !payload.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const userFromDb = await this.dataSource.getRepository(User).findOne({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
      },
    });

    if (!userFromDb) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (
      userFromDb.status === UserStatus.SUSPENDED ||
      userFromDb.status === UserStatus.DISABLED
    ) {
      throw new ForbiddenException(`Account is ${userFromDb.status}`);
    }

    return {
      id: userFromDb.id,
      email: userFromDb.email,
      username: userFromDb.username,
      role: userFromDb.role,
    };
  }
}
