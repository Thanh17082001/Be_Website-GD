import { Module } from '@nestjs/common';
import { PricequotesService } from './pricequotes.service';
import { PricequotesController } from './pricequotes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pricequote } from './entities/pricequote.entity';
import { PricequoteDetail } from 'src/pricequote-details/entities/pricequote-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pricequote,
      PricequoteDetail,
    ]),
  ],
  controllers: [PricequotesController],
  providers: [PricequotesService],
})
export class PricequotesModule { }
