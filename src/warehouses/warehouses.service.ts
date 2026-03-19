import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWarehouseDto: CreateWarehouseDto) {
    const existingWarehouse = await this.prisma.warehouse.findFirst({
      where: {
        name: createWarehouseDto.name,
      },
    });

    if (existingWarehouse) {
      throw new ConflictException('Warehouse name already exists');
    }

    return this.prisma.warehouse.create({
      data: {
        name: createWarehouseDto.name,
        location: createWarehouseDto.location,
        maxCapacityUnits: createWarehouseDto.maxCapacityUnits,
        isActive: createWarehouseDto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.warehouse.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        operators: {
          include: {
            user: true,
          },
        },
        inventoryMovements: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    if (updateWarehouseDto.name && updateWarehouseDto.name !== warehouse.name) {
      const existingWarehouse = await this.prisma.warehouse.findFirst({
        where: {
          name: updateWarehouseDto.name,
          NOT: { id },
        },
      });

      if (existingWarehouse) {
        throw new ConflictException('Warehouse name already exists');
      }
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: updateWarehouseDto,
    });
  }
}
