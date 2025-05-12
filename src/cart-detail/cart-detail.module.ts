import { Module } from '@nestjs/common';
import { CartDetailService } from './cart-detail.service';
import { CartDetailController } from './cart-detail.controller';

@Module({
  controllers: [CartDetailController],
  providers: [CartDetailService],
})
export class CartDetailModule {}
