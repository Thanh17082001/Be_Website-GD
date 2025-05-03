import { Module } from '@nestjs/common';
import { TypeProductsService } from './type-products.service';
import { TypeProductsController } from './type-products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeProduct } from './entities/type-product.entity';
import { Grade } from 'src/grades/entities/grade.entity';
import { TypeParent } from 'src/type-parents/entities/type-parent.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([TypeProduct, Grade, TypeParent])
  ],
  controllers: [TypeProductsController],
  providers: [TypeProductsService],
})
export class TypeProductsModule {}
