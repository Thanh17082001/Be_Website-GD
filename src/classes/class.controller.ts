import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { User } from 'src/users/entities/user.entity';
import { RoleGuard } from 'src/role/role.guard';
import { Public } from 'src/auth/auth.decorator';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { Class } from './entities/class.entity';

@Controller('classes')
@UseGuards(RoleGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createClassDto: CreateClassDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    // console.log(user)
    return this.classService.create(createClassDto, user);
  }

  @Get()
  // @Roles(Role.ADMIN)
  @Public()
  async findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Class>, @Req() request: Request) {
    const user = request['user'] ?? null;
    return this.classService.findAll(pageOptionDto, query, user);
  } 
  @Get('findbydeleted')
  @Roles(Role.ADMIN)
  async findByDeleted(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Class>, @Req() request: Request) {
    const user = request['user'] ?? null;
    return this.classService.findByDeleted(pageOptionDto, query, user);
  } 

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.classService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classService.update(+id, updateClassDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.classService.remove(+id);
  }
  @Patch('restore/:id')
  @Roles(Role.ADMIN)
  restore(@Param('id') id: string) {
    return this.classService.restore(+id);
  }
}
