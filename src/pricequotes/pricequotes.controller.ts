import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { PricequotesService } from './pricequotes.service';
import { CreatePricequoteDto } from './dto/create-pricequote.dto';
import { UpdatePricequoteDto } from './dto/update-pricequote.dto';
import { User } from 'src/users/entities/user.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions, storage } from 'src/config/multer';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { Public } from 'src/auth/auth.decorator';

@Controller('pricequotes')
@UseGuards(AuthGuard)
export class PricequotesController {
  constructor(private readonly pricequotesService: PricequotesService) { }

  @Post()
  @Roles(Role.ADMIN, Role.CUSTOMER)
  create(@Body() createPricequoteDto: CreatePricequoteDto, @Req() request: Request) {
    const user: User = request['user'];
    return this.pricequotesService.create(createPricequoteDto, user);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(@Query() pageOptionDto: PageOptionsDto, @Req() request: Request) {
    const user = request['user'] ?? null;
    return this.pricequotesService.findAll(pageOptionDto, user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CUSTOMER)
  findOne(@Param('id') id: string) {
    return this.pricequotesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updatePricequoteDto: UpdatePricequoteDto, @Req() request: Request,) {
    return this.pricequotesService.update(+id, updatePricequoteDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.pricequotesService.remove(+id);
  }
  @Patch('restore/:id')
  @Roles(Role.ADMIN)
  async restore(@Param('id') id: string) {
    return this.pricequotesService.restore(+id);
  }
}
