import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'darkknight_updated',
    description: 'Updated username',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim() : '',
  )
  username?: string;

  @ApiPropertyOptional({
    example: 'newuser@example.com',
    description: 'Updated email address',
  })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : '',
  )
  email?: string;

  @ApiPropertyOptional({
    example: 'NewSecurePassword123',
    description: 'Updated plain text password',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Updated role of the user (superadmin, admin, user)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: UserStatus,
    description: 'Updated account status (active, suspended, disabled)',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
