import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartDetail } from 'src/cart-detail/entities/cart-detail.entity';
import { Product } from 'src/products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartDetail, Product])],
  controllers: [CartsController],
  providers: [CartsService],
})
export class CartsModule {}
