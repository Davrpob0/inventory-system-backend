import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Bodega Central' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'Medellín, Antioquia' })
  @IsString()
  @MaxLength(150)
  location!: string;

  @ApiProperty({ example: 5000 })
  @IsInt()
  @Min(1)
  maxCapacityUnits!: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
