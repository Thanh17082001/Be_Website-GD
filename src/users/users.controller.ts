import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePassDto } from './dto/change-pass-dto';
import { Public } from 'src/auth/auth.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('admin')
  async createAdmin(@Body() createUserDto: CreateUserDto) {
    const userDto: CreateUserDto = {
        fullName: `Quản Trị Viên `,
        username: 'admin',
        email: 'admin@gmail.com',
        role: 'Quản trị viên',
        password: '1',
        isAdmin: true,
    };
    console.log(1)
    const user = await this.userService.create(userDto);
    console.log(2)
    return user;
}

@Post('change-password')
async changePassword(@Body() dto: ChangePassDto) {
    const { userId, password, newPassword } = dto;
    const user = await this.userService.changePassword({ userId, password, newPassword });
    return user;
}

  @Post()
  @Public()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
