import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { AssignWarehouseDto } from './dto/assign-warehouse.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        fullName: createUserDto.fullName,
        role: createUserDto.role,
        isActive: createUserDto.isActive ?? true,
      },
      include: {
        warehouseOperator: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      warehouseOperator: user.warehouseOperator,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        warehouseOperator: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      warehouseOperator: user.warehouseOperator,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        warehouseOperator: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      warehouseOperator: user.warehouseOperator,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async assignWarehouse(userId: string, dto: AssignWarehouseDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        warehouseOperator: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.OPERATOR) {
      throw new BadRequestException(
        'Only OPERATOR users can be assigned to a warehouse',
      );
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    if (!warehouse.isActive) {
      throw new BadRequestException('Warehouse is inactive');
    }

    if (user.warehouseOperator) {
      const updatedAssignment = await this.prisma.warehouseOperator.update({
        where: { userId: user.id },
        data: {
          warehouseId: dto.warehouseId,
        },
        include: {
          warehouse: true,
          user: true,
        },
      });

      return updatedAssignment;
    }

    const assignment = await this.prisma.warehouseOperator.create({
      data: {
        userId: user.id,
        warehouseId: dto.warehouseId,
      },
      include: {
        warehouse: true,
        user: true,
      },
    });

    return assignment;
  }
}
