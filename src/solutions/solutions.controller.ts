import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { SolutionsService } from './solutions.service';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { UpdateSolutionDto } from './dto/update-solution.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { User } from 'src/users/entities/user.entity';
import { Public } from 'src/auth/auth.decorator';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';

@Controller('solutions')
@UseGuards(AuthGuard)
export class SolutionsController {
  constructor(private readonly solutionsService: SolutionsService) { }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createSolutionDto: CreateSolutionDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.solutionsService.create(createSolutionDto, user);
  }

  @Get()
  @Public()
  findAll(@Query() pageOptionDto: PageOptionsDto, @Req() request: Request) {
    const user = request['user'] ?? null;
    return this.solutionsService.findAll(pageOptionDto, user);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.solutionsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateSolutionDto: UpdateSolutionDto) {
    return this.solutionsService.update(+id, updateSolutionDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.solutionsService.remove(+id);
  }
  @Patch('restore/:id')
  @Roles(Role.ADMIN)
  restore(@Param('id') id: string) {
    return this.solutionsService.restore(+id);
  }
}
