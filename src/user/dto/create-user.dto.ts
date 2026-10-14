import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'darkknight',
    description: 'Unique username for the user account',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim() : '',
  )
  username: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Unique email address',
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : '',
  )
  email: string;

  @ApiProperty({
    example: 'P@ssword123',
    description: 'User plain text password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.USER,
    description: 'Role of the user (superadmin, admin, user)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.USER;

  @ApiPropertyOptional({
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    description: 'Account status (active, suspended, disabled)',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus = UserStatus.ACTIVE;
}
