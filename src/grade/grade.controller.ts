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

@Controller('grade')
@UseGuards(RoleGuard)
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post()
  // @Roles(Role.ADMIN)
  @Public()
  async create() {
    let createGradeDto: CreateGradeDto = new CreateGradeDto();
    let result = []
    const names: string[] = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    for (let i = 0; i < names.length; i++) {
      createGradeDto.name = names[i];
      result.push(await this.gradeService.create(createGradeDto));
    }
    return result
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
