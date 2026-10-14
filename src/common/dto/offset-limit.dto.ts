import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class OffsetLimitDto {
  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Maximum number of items to return',
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 100;
}
