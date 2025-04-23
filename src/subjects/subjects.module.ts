import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from 'src/grade/entities/grade.entity';
import { Subject } from './entities/subject.entity';
import { Product } from 'src/product/entities/product.entity';
import { Class } from 'src/class/entities/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Grade, Product, Class])],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}
