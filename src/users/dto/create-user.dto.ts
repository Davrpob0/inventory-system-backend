import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'operator1@test.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Operator123*' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Operator Test' })
  @IsString()
  @MinLength(3)
  fullName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.OPERATOR })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;
}
