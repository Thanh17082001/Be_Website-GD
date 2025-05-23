import { Injectable } from '@nestjs/common';
import { CreatePricequoteDetailDto } from './dto/create-pricequote-detail.dto';
import { UpdatePricequoteDetailDto } from './dto/update-pricequote-detail.dto';

@Injectable()
export class PricequoteDetailsService {
  create(createPricequoteDetailDto: CreatePricequoteDetailDto) {
    return 'This action adds a new pricequoteDetail';
  }

  findAll() {
    return `This action returns all pricequoteDetails`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pricequoteDetail`;
  }

  update(id: number, updatePricequoteDetailDto: UpdatePricequoteDetailDto) {
    return `This action updates a #${id} pricequoteDetail`;
  }

  remove(id: number) {
    return `This action removes a #${id} pricequoteDetail`;
  }
}
