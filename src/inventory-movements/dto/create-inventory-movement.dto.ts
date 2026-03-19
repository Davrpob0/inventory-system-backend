import { ApiProperty } from '@nestjs/swagger';
import { MovementType } from '../../generated/prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInventoryMovementDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '22222222-2222-2222-2222-222222222222' })
  @IsUUID()
  warehouseId!: string;

  @ApiProperty({ enum: MovementType, example: MovementType.ENTRY })
  @IsEnum(MovementType)
  type!: MovementType;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 'PO-2026-001', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiProperty({ example: 'Ingreso inicial de inventario', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
