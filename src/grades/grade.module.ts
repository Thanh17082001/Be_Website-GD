import { Module } from '@nestjs/common';
import { GradeService } from './grade.service';
import { GradeController } from './grade.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from './entities/grade.entity';
import { TypeParent } from 'src/type-parents/entities/type-parent.entity';
import { TypeProduct } from 'src/type-products/entities/type-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, TypeParent, TypeProduct])],
  controllers: [GradeController],
  providers: [GradeService],
  exports:[TypeOrmModule, GradeService]
})
export class GradeModule {}
