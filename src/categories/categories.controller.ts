import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { RoleGuard } from 'src/role/role.guard';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { User } from 'src/users/entities/user.entity';
import { Public } from 'src/auth/auth.decorator';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';

@Controller('categories')
@UseGuards(RoleGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createCategoryDto: CreateCategoryDto, @Req() request: Request) {
    // console.log('test')
    const user: User = request['user'] ?? null;
    return this.categoriesService.create(createCategoryDto, user);
  }

  @Get()
  @Public()
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @Req() request: Request
  ) {
    const user = request['user'] ?? null;
    return this.categoriesService.findAll(pageOptionsDto, user);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
