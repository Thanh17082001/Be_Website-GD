import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { RoleGuard } from 'src/role/role.guard';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { User } from 'src/users/entities/user.entity';
import { Public } from 'src/auth/auth.decorator';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';

@Controller('contacts')
@UseGuards(RoleGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) { }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createContactDto: CreateContactDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.contactsService.create(createContactDto, user);
  }

  @Get()
  @Public()
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @Req() request: Request
  ) {
    const user = request['user'] ?? null;
    return this.contactsService.findAll(pageOptionsDto, user); // Không cần truyền user nếu không dùng
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto, @Req() request: Request) {
    const user: User = request['user']
    return this.contactsService.update(+id, updateContactDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    const user: User = request['user'];
    return this.contactsService.remove(+id, user);
  }
}
