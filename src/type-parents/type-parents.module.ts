import { Module } from '@nestjs/common';
import { TypeParentsService } from './type-parents.service';
import { TypeParentsController } from './type-parents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeParent } from './entities/type-parent.entity';
import { Grade } from 'src/grades/entities/grade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TypeParent, Grade])],
  controllers: [TypeParentsController],
  providers: [TypeParentsService],
})
export class TypeParentsModule {}
