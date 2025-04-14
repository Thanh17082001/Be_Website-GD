import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExamplesService } from './examples.service';
import { CreateExampleDto } from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { Example } from './entities/example.entity';

@Controller('examples')
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Post()
  create(@Body() createExampleDto: CreateExampleDto) {
    return this.examplesService.create(createExampleDto);
  }

  @Get()
  async findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Example>) {
    return this.examplesService.findAll(pageOptionDto,query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examplesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExampleDto: UpdateExampleDto) {
    return this.examplesService.update(+id, updateExampleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examplesService.remove(+id);
  }
}
