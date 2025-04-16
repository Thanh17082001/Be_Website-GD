import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { User } from 'src/users/entities/user.entity';
import { RoleGuard } from 'src/role/role.guard';
import { Public } from 'src/auth/auth.decorator';

@Controller('class')
@UseGuards(RoleGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @Public()
  create(@Body() createClassDto: CreateClassDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.classService.create(createClassDto, user);
  }

  @Get()
  findAll() {
    return this.classService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classService.update(+id, updateClassDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classService.remove(+id);
  }
}
