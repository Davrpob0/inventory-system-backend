import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'SKU1001' })
  @IsString()
  @Matches(/^[A-Z0-9]{4,20}$/, {
    message:
      'sku must contain only uppercase letters and numbers, length 4 to 20',
  })
  sku!: string;

  @ApiProperty({ example: 'Teclado Mecánico' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Teclado mecánico RGB', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ example: 'unit' })
  @IsString()
  @MaxLength(30)
  unitOfMeasure!: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  minStockAlert!: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
