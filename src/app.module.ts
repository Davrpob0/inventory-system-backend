import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { ProductsModule } from './products/products.module';
import { InventoryMovementsModule } from './inventory-movements/inventory-movements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WarehousesModule,
    ProductsModule,
    InventoryMovementsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
