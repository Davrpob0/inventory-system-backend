import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { InventoryMovementsService } from './inventory-movements.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';

@ApiTags('Inventory Movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory-movements')
export class InventoryMovementsController {
  constructor(
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create inventory movement' })
  create(
    @Body() dto: CreateInventoryMovementDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.inventoryMovementsService.create(dto, currentUser);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List inventory movements' })
  findAll() {
    return this.inventoryMovementsService.findAll();
  }

  @Get('stock')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get stock summary by warehouse and product' })
  getStockSummary() {
    return this.inventoryMovementsService.getStockSummary();
  }

  @Get('stock/:warehouseId/:productId')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Get stock by warehouse and product' })
  async getStockByWarehouseAndProduct(
    @Param('warehouseId', new ParseUUIDPipe()) warehouseId: string,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    const stock =
      await this.inventoryMovementsService.getStockByWarehouseAndProduct(
        warehouseId,
        productId,
      );

    return {
      warehouseId,
      productId,
      stock,
    };
  }
}
