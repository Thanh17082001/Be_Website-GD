import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { Class } from 'src/class/entities/class.entity';
import { Grade } from 'src/grade/entities/grade.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassModule } from 'src/class/class.module';
import { GradeModule } from 'src/grade/grade.module';
import { Subject } from 'src/subjects/entities/subject.entity';
import { TypeProduct } from 'src/type-products/entities/type-product.entity';
import { Category } from 'src/categories/entities/category.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Class, Grade, Subject, TypeProduct, Category]), 
    ClassModule,  
    GradeModule,  
  ],
  controllers: [ProductController],
  providers: [ProductService],
  
})
export class ProductModule {}
