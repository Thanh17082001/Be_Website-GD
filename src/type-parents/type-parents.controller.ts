import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { TypeParentsService } from './type-parents.service';
import { CreateTypeParentDto } from './dto/create-type-parent.dto';
import { UpdateTypeParentDto } from './dto/update-type-parent.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { User } from 'src/users/entities/user.entity';
import { Public } from 'src/auth/auth.decorator';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { TypeParent } from './entities/type-parent.entity';

@Controller('type-parents')
@UseGuards(AuthGuard)
export class TypeParentsController {
  constructor(private readonly typeParentsService: TypeParentsService) { }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createTypeParentDto: CreateTypeParentDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.typeParentsService.create({
      ...createTypeParentDto
    }, user)
  }

  @Get()
  @Public()
  findAll(
    @Query() pageOptionDto: PageOptionsDto,
    @Query() query: Partial<TypeParent>,
  ) {
    return this.typeParentsService.findAll(pageOptionDto, query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.typeParentsService.findOne(+id);
  }
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateTypeParentDto: UpdateTypeParentDto) {
    return this.typeParentsService.update(+id, updateTypeParentDto);
  }
  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.typeParentsService.remove(+id);
  }
  @Patch('restore/:id')
  @Public()
  restore(@Param('id') id: string) {
    return this.typeParentsService.restore(+id);
  }
}
