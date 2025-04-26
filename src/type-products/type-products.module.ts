import { Module } from '@nestjs/common';
import { TypeProductsService } from './type-products.service';
import { TypeProductsController } from './type-products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeProduct } from './entities/type-product.entity';
import { Grade } from 'src/grades/entities/grade.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([TypeProduct, Grade])
  ],
  controllers: [TypeProductsController],
  providers: [TypeProductsService],
})
export class TypeProductsModule {}
