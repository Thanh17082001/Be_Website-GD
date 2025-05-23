import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseInterceptors, UploadedFile, NotFoundException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePassDto } from './dto/change-pass-dto';
import { Public } from 'src/auth/auth.decorator';
import { User } from './entities/user.entity';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, storage } from 'src/config/multer';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  @Post('admin')
  @Public()
  async createAdmin() {
    const userDto: CreateUserDto = {
      fullName: `Quản Trị Viên `,
      username: 'admin',
      email: 'admin@gmail.com',
      role: 'Quản trị viên',
      password: '11111111',
      isAdmin: true,
      images: 'public/user/image/default-avatar.png'
    };
    console.log(1)
    const user = await this.userService.create(userDto);
    console.log(2)
    return user;
  }

  @Post('change-password')
  async changePassword(@Body() dto: ChangePassDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    const changePass = await this.userService.changePassword({ ...dto }, user);
    return changePass;
  }
  @Get() // Route GET /users
  @Public() // Mở route nếu không yêu cầu xác thực
  async findAll(@Query() pageOptionsDto: PageOptionsDto, @Req() request: Request) {
    const currentUser = request['user'] ?? null; // Lấy user đang đăng nhập nếu có
    return this.userService.findAll(pageOptionsDto, currentUser);
  }

  @Post()
  // @Roles(Role.ADMIN)
  @Public()
  @UseInterceptors(FileInterceptor('images', {
    storage: storage('user', true), // folder lưu ảnh user
    ...multerOptions,
  }))
  create(
    @UploadedFile() images: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
  ) {
    const filePath = images ? `public/user/image/${images.filename}` : 'public/user/image/default-avatar.png';
    return this.userService.create({ ...createUserDto, images: filePath });
  }

  @Patch(':id')
  @Public()
  @UseInterceptors(FileInterceptor('images', {
    storage: storage('user', true),
    ...multerOptions,
  }))
  async update(
    @Param('id') id: string,
    @UploadedFile() images: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto
  ) {
    // Lấy user hiện tại từ DB
    const existingUser = await this.userService.findOne(+id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Nếu có file thì cập nhật đường dẫn ảnh mới
    if (images) {
      updateUserDto.images = `public/user/image/${images.filename}`;
    } else {
      // Không có file => giữ ảnh cũ
      updateUserDto.images = existingUser.images;
    }

    return this.userService.update(+id, updateUserDto);
  }
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
