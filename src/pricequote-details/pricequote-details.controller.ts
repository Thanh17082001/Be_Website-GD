import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PricequoteDetailsService } from './pricequote-details.service';
import { CreatePricequoteDetailDto } from './dto/create-pricequote-detail.dto';
import { UpdatePricequoteDetailDto } from './dto/update-pricequote-detail.dto';

@Controller('pricequote-details')
export class PricequoteDetailsController {
  constructor(private readonly pricequoteDetailsService: PricequoteDetailsService) {}

  @Post()
  create(@Body() createPricequoteDetailDto: CreatePricequoteDetailDto) {
    return this.pricequoteDetailsService.create(createPricequoteDetailDto);
  }

  @Get()
  findAll() {
    return this.pricequoteDetailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pricequoteDetailsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePricequoteDetailDto: UpdatePricequoteDetailDto) {
    return this.pricequoteDetailsService.update(+id, updatePricequoteDetailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pricequoteDetailsService.remove(+id);
  }
}
