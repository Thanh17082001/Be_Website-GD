import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, Req, UploadedFile } from '@nestjs/common';
import { TypeProductsService } from './type-products.service';
import { CreateTypeProductDto } from './dto/create-type-product.dto';
import { UpdateTypeProductDto } from './dto/update-type-product.dto';
import { Public } from 'src/auth/auth.decorator';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { TypeProduct } from './entities/type-product.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, storage } from 'src/config/multer';
import { User } from 'src/users/entities/user.entity';

@Controller('type-products')
@UseGuards(AuthGuard)
export class TypeProductsController {
  constructor(private readonly typeProductsService: TypeProductsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('images', { storage: storage('type-product', true), ...multerOptions }))
  create(@UploadedFile() images: Express.Multer.File, @Body() createTypeProductDto: CreateTypeProductDto, @Req() request: Request) {
    // console.log(images)
    const user: User = request['user'] ?? null;
    const filePath = `public/type-product/image/${images?.filename}`;
    return this.typeProductsService.create({...createTypeProductDto, images: filePath}, user);
  }

  @Get()
  @Public()
  async findAll(
    @Query() pageOptionDto: PageOptionsDto,
    @Query() query: Partial<TypeProduct>,
  ) {
    return this.typeProductsService.findAll(pageOptionDto, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.typeProductsService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('images', {
    storage: storage('type-product', true),
    ...multerOptions,
  }))
  update(@Param('id') id: string, @Body() updateTypeProductDto: UpdateTypeProductDto, @UploadedFile() images: Express.Multer.File) {
    return this.typeProductsService.update(+id, updateTypeProductDto, images);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.typeProductsService.remove(+id);
  }
  @Patch('restore/:id')
  @Public()
  restore(@Param('id') id: string) {
    return this.typeProductsService.restore(+id);
  }
}
