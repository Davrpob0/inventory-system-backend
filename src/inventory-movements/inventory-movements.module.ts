import { Module } from '@nestjs/common';
import { InventoryMovementsService } from './inventory-movements.service';
import { InventoryMovementsController } from './inventory-movements.controller';

@Module({
  providers: [InventoryMovementsService],
  controllers: [InventoryMovementsController]
})
export class InventoryMovementsModule {}
