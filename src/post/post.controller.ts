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

@Controller('post')
@UseGuards(AuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', { storage: storage('post', true), ...multerOptions }))
  create(@UploadedFile() image: Express.Multer.File,@Body() createPostDto: CreatePostDto, @Req() request: Request) {
    // console.log('Image:', image);
    // console.log('Body:', createPostDto);
    const user: User = request['user'] ?? null;
    const filePath = `public/post/image/${image.filename}`;
    return this.postService.create({...createPostDto, image: filePath}, user); 
  }

  @Get()
  @Public()
  async findAll(@Query() pageOptionDto: PageOptionsDto,  @Req() request: Request) {
    const user = request['user'] ?? null;
    return this.postService.findAll(pageOptionDto, user);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(+id, updatePostDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
}
