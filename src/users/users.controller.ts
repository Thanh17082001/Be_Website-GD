import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePassDto } from './dto/change-pass-dto';
import { Public } from 'src/auth/auth.decorator';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('admin')
  async createAdmin() {
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
async changePassword(@Body() dto: ChangePassDto, @Req() request: Request) {
    const { password, newPassword } = dto;
    const user: User = request['user'] ?? null;
    const changePass = await this.userService.changePassword({ ...dto }, user);
    return changePass;
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
