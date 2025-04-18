import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { Class } from 'src/class/entities/class.entity';
import { Grade } from 'src/grade/entities/grade.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassModule } from 'src/class/class.module';
import { GradeModule } from 'src/grade/grade.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Class, Grade]), 
    ClassModule,  
    GradeModule,  
  ],
  controllers: [ProductController],
  providers: [ProductService],
  
})
export class ProductModule {}
