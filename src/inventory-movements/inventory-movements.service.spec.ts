import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MovementType, UserRole } from '../generated/prisma/client';
import { InventoryMovementsService } from './inventory-movements.service';

describe('InventoryMovementsService', () => {
  let service: InventoryMovementsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
      warehouse: {
        findUnique: jest.fn(),
      },
      inventoryMovement: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new InventoryMovementsService(prisma);
  });

  it('should create an ENTRY movement successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      role: UserRole.ADMIN,
      warehouseOperator: null,
    });

    prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      isActive: true,
      minStockAlert: 10,
    });

    prisma.warehouse.findUnique.mockResolvedValue({
      id: 'warehouse-1',
      isActive: true,
    });

    prisma.inventoryMovement.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ type: MovementType.ENTRY, quantity: 20 }]);

    prisma.inventoryMovement.create.mockResolvedValue({
      id: 'movement-1',
      type: MovementType.ENTRY,
      quantity: 20,
      product: { id: 'product-1', name: 'Test Product' },
      warehouse: { id: 'warehouse-1', name: 'Test Warehouse' },
      user: { id: 'user-1', email: 'admin@test.com' },
    });

    const result = await service.create(
      {
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        type: MovementType.ENTRY,
        quantity: 20,
      },
      {
        id: 'user-1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      },
    );

    expect(prisma.inventoryMovement.create).toHaveBeenCalled();
    expect(result.stockAfterMovement).toBe(20);
  });

  it('should reject EXIT when stock is insufficient', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      role: UserRole.ADMIN,
      warehouseOperator: null,
    });

    prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      isActive: true,
      minStockAlert: 10,
    });

    prisma.warehouse.findUnique.mockResolvedValue({
      id: 'warehouse-1',
      isActive: true,
    });

    prisma.inventoryMovement.findMany.mockResolvedValue([
      { type: MovementType.ENTRY, quantity: 5 },
    ]);

    await expect(
      service.create(
        {
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          type: MovementType.EXIT,
          quantity: 10,
        },
        {
          id: 'user-1',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('should reject OPERATOR acting outside assigned warehouse', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      isActive: true,
      role: UserRole.OPERATOR,
      warehouseOperator: {
        warehouseId: 'warehouse-allowed',
      },
    });

    prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      isActive: true,
      minStockAlert: 10,
    });

    prisma.warehouse.findUnique.mockResolvedValue({
      id: 'warehouse-other',
      isActive: true,
    });

    await expect(
      service.create(
        {
          productId: 'product-1',
          warehouseId: 'warehouse-other',
          type: MovementType.ENTRY,
          quantity: 10,
        },
        {
          id: 'user-2',
          email: 'operator@test.com',
          role: UserRole.OPERATOR,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should fail if product does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      role: UserRole.ADMIN,
      warehouseOperator: null,
    });

    prisma.product.findUnique.mockResolvedValue(null);
    prisma.warehouse.findUnique.mockResolvedValue({
      id: 'warehouse-1',
      isActive: true,
    });

    await expect(
      service.create(
        {
          productId: 'product-missing',
          warehouseId: 'warehouse-1',
          type: MovementType.ENTRY,
          quantity: 10,
        },
        {
          id: 'user-1',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
