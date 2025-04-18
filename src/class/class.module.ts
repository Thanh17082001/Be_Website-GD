import { Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { GradeModule } from 'src/grade/grade.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { Product } from 'src/product/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Product]), GradeModule],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService,TypeOrmModule],
})
export class ClassModule {}
