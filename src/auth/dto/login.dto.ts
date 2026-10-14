import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered user email address',
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : '',
  )
  email: string;

  @ApiProperty({
    example: 'P@ssword123',
    description: 'Account password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
