import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Public } from 'src/auth/auth.decorator';
import { User } from 'src/users/entities/user.entity';
import { AuthGuard } from 'src/auth/auth.guard';
// import { Role } from 'src/role/entities/role.entity';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, storage } from 'src/config/multer';

@Controller('posts')
@UseGuards(AuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) { }

  @Post()
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('images', { storage: storage('post', true), ...multerOptions }))
  create(@UploadedFile() images: Express.Multer.File, @Body() createPostDto: CreatePostDto, @Req() request: Request) {
    // console.log('Image:', image);
    // console.log('Body:', createPostDto);
    const user: User = request['user'] ?? null;
    const filePath = `public/post/image/${images.filename}`;
    return this.postService.create({ ...createPostDto, images: filePath }, user);
  }

  @Get()
  @Public()
  // @Roles(Role.ADMIN, Role.CUSTOMER)
  async findAll(@Query() pageOptionDto: PageOptionsDto, @Req() request: Request) {
    const user = request['user'] ?? null;
    return this.postService.findAll(pageOptionDto, user);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('images', { storage: storage('post', true), ...multerOptions }))
  update(
    @Param('id') id: string,
    @UploadedFile() images: Express.Multer.File,
    @Body() updatePostDto: UpdatePostDto,
    @Req() request: Request,
  ) {
    const user: User = request['user'] ?? null;

    // Nếu có file ảnh mới được upload thì cập nhật đường dẫn vào DTO
    if (images) {
      const filePath = `public/post/image/${images.filename}`;
      updatePostDto.images = filePath;
    }

    return this.postService.update(+id, updatePostDto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
  @Patch('restore/:id')
  @Roles(Role.ADMIN)
  async restore(@Param('id') id: string) {
    return this.postService.restore(+id);
  }
}
