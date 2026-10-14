import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { OffsetLimitDto } from '../../common/dto/offset-limit.dto';
import { UserRole, UserStatus } from '../entities/user.entity';

export class GetUserDto extends OffsetLimitDto {
  @ApiPropertyOptional({
    description: 'Search query across username or email',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  search?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Entity relations to load',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
      return [value];
    }
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  relations?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Specific fields to select from the entity',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
      return [value];
    }
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  select?: string[];

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Filter by role',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: UserStatus,
    description: 'Filter by account status',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
