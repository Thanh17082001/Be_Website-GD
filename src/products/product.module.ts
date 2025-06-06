import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { Class } from 'src/classes/entities/class.entity';
import { Grade } from 'src/grades/entities/grade.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassModule } from 'src/classes/class.module';
import { GradeModule } from 'src/grades/grade.module';
import { Subject } from 'src/subjects/entities/subject.entity';
import { TypeProduct } from 'src/type-products/entities/type-product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { TypeParent } from 'src/type-parents/entities/type-parent.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Class, Grade, Subject, TypeProduct, Category, TypeParent]), 
    ClassModule,  
    GradeModule,  
  ],
  controllers: [ProductController],
  providers: [ProductService],
  
})
export class ProductModule {}
