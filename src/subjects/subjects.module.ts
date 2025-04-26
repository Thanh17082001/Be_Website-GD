import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from 'src/grades/entities/grade.entity';
import { Subject } from './entities/subject.entity';
import { Product } from 'src/products/entities/product.entity';
import { Class } from 'src/classes/entities/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Grade, Product, Class])],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}
