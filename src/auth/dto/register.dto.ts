import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'darkknight',
    description: 'Unique username for account',
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
    description: 'Plain text password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
