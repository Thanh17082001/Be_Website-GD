import { Module } from '@nestjs/common';
import { PricequoteDetailsService } from './pricequote-details.service';
import { PricequoteDetailsController } from './pricequote-details.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pricequote } from 'src/pricequotes/entities/pricequote.entity';
import { PricequoteDetail } from './entities/pricequote-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pricequote,
      PricequoteDetail, // PHẢI có dòng này!
    ]),
  ],
  controllers: [PricequoteDetailsController],
  providers: [PricequoteDetailsService],
})
export class PricequoteDetailsModule {}
