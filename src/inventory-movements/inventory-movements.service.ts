import {
  UnprocessableEntityException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementType, UserRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class InventoryMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateInventoryMovementDto,
    currentUser: AuthenticatedUser,
  ) {
    const [user, product, warehouse] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: currentUser.id },
        include: { warehouseOperator: true },
      }),
      this.prisma.product.findUnique({
        where: { id: dto.productId },
      }),
      this.prisma.warehouse.findUnique({
        where: { id: dto.warehouseId },
      }),
    ]);

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or inactive');
    }

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or inactive');
    }

    if (!warehouse || !warehouse.isActive) {
      throw new NotFoundException('Warehouse not found or inactive');
    }

    if (
      user.role === UserRole.OPERATOR &&
      user.warehouseOperator?.warehouseId !== dto.warehouseId
    ) {
      throw new ForbiddenException(
        'Operator can only register movements in assigned warehouse',
      );
    }

    const currentStock = await this.getStockByWarehouseAndProduct(
      dto.warehouseId,
      dto.productId,
    );

    if (dto.type === MovementType.EXIT && currentStock < dto.quantity) {
      throw new UnprocessableEntityException('Insufficient stock');
    }

    const movement = await this.prisma.inventoryMovement.create({
      data: {
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        userId: user.id,
        type: dto.type,
        quantity: dto.quantity,
        reference: dto.reference,
        notes: dto.notes,
      },
      include: {
        product: true,
        warehouse: true,
        user: true,
      },
    });

    const updatedStock = await this.getStockByWarehouseAndProduct(
      dto.warehouseId,
      dto.productId,
    );

    return {
      movement,
      stockAfterMovement: updatedStock,
    };
  }

  async findAll() {
    return this.prisma.inventoryMovement.findMany({
      include: {
        product: true,
        warehouse: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStockByWarehouseAndProduct(warehouseId: string, productId: string) {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        warehouseId,
        productId,
      },
      select: {
        type: true,
        quantity: true,
      },
    });

    return movements.reduce((acc, movement) => {
      if (movement.type === MovementType.ENTRY) {
        return acc + movement.quantity;
      }

      return acc - movement.quantity;
    }, 0);
  }

  async getStockSummary() {
    const movements = await this.prisma.inventoryMovement.findMany({
      include: {
        product: true,
        warehouse: true,
      },
    });

    const stockMap = new Map<
      string,
      {
        warehouseId: string;
        warehouseName: string;
        productId: string;
        productName: string;
        sku: string;
        currentStock: number;
        minStockAlert: number;
        belowMinStock: boolean;
      }
    >();

    for (const movement of movements) {
      const key = `${movement.warehouseId}-${movement.productId}`;

      if (!stockMap.has(key)) {
        stockMap.set(key, {
          warehouseId: movement.warehouseId,
          warehouseName: movement.warehouse.name,
          productId: movement.productId,
          productName: movement.product.name,
          sku: movement.product.sku,
          currentStock: 0,
          minStockAlert: movement.product.minStockAlert,
          belowMinStock: false,
        });
      }

      const current = stockMap.get(key)!;

      if (movement.type === MovementType.ENTRY) {
        current.currentStock += movement.quantity;
      } else {
        current.currentStock -= movement.quantity;
      }

      current.belowMinStock = current.currentStock < current.minStockAlert;
    }

    return Array.from(stockMap.values()).sort((a, b) =>
      a.warehouseName.localeCompare(b.warehouseName),
    );
  }
}
