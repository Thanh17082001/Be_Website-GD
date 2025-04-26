import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { GradeService } from './grade.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { RoleGuard } from 'src/role/role.guard';
import { Roles } from 'src/role/role.decorator';
import { Public } from 'src/auth/auth.decorator';
import { Role } from 'src/role/role.enum';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { Grade } from './entities/grade.entity';
import { User } from 'src/users/entities/user.entity';

@Controller('grades')
@UseGuards(RoleGuard)
export class GradeController {
  constructor(private readonly gradeService: GradeService) { }

  @Post()
  // @Roles(Role.ADMIN)
  @Public()
  async create(@Body() createGradeDto: CreateGradeDto, @Req() request: Request) {
    // let createGradeDto: CreateGradeDto = new CreateGradeDto();
    const user: User = request['user'] ?? null;
    // let result = []
    // // Danh sách các tên cấp học
    // const names: string[] = ['Mầm non', 'Tiểu học', 'THCS', 'THPT'];
    // for (let i = 0; i < names.length; i++) {
    //   createGradeDto.name = names[i];
    //   result.push(await this.gradeService.create(createGradeDto, user));
    // }
    return this.gradeService.create(createGradeDto, user)
  }

  @Get()
  @Public()
  async findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<Grade>, @Req() request: Request) {
    // const user = request['user'] ?? null;
    return this.gradeService.findAll(pageOptionDto, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.gradeService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateGradeDto: UpdateGradeDto) {
    return this.gradeService.update(+id, updateGradeDto);
  }

}
