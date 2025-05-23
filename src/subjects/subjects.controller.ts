import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { RoleGuard } from 'src/role/role.guard';
import { User } from 'src/users/entities/user.entity';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { Public } from 'src/auth/auth.decorator';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { Subject } from './entities/subject.entity';

@Controller('subjects')
@UseGuards(RoleGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) { }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createSubjectDto: CreateSubjectDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.subjectsService.create(createSubjectDto, user);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @Query() query: Partial<Subject>,
    @Req() request: Request
  ) {
    const user = request['user'] ?? null;
    return this.subjectsService.findAll(pageOptionsDto, query, user);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(+id, updateSubjectDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(+id);
  }
  @Patch('restore/:id')
  @Roles(Role.ADMIN)
  restore(@Param('id') id: string) {
    return this.subjectsService.restore(+id);
  }
}
