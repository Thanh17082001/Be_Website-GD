import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/role/role.decorator';
import { Product } from './entities/product.entity';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/role/role.enum';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions, storage } from 'src/config/multer';
import { ApiConsumes } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/customize.decorator';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';

@Controller('product')
@UseGuards(AuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(Role.ADMIN)
  // @Public()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: storage('product', true),
      ...multerOptions
    })
  )
  async create(
    @Body() createProductDto: CreateProductDto,
    @Req() request: Request,
    @UploadedFiles() files: Express.Multer.File[],
    
  ) {
    // console.log(createProductDto.classes)
    // console.log(JSON.parse(createProductDto.subjectIds))
    // console.log(files)
    const user: User = request['user'];
    // console.log(user)
    // Gán mảng file tên ảnh vào DTO
    // createProductDto.subjects = JSON.parse(createProductDto.subjects as any);
    // createProductDto.classes = JSON.parse(createProductDto.classes as any);
    createProductDto.categoryIds = JSON.parse(createProductDto.categoryIds as any);
    createProductDto.images = files.map(file => `public/product/${file.filename}`);

    return await this.productService.create(createProductDto, user);
  }

  @Get() // Đánh dấu đây là route GET
  @Public() // Nếu bạn muốn route này công khai, có thể bỏ qua nếu không cần
  async findAll(@Query() pageOptionsDto: PageOptionsDto, @Req() request: Request) {
    const user = request['user'] ?? null; // Lấy user từ request (nếu có)
    return this.productService.findAll(pageOptionsDto, user); // Gọi service để lấy danh sách sản phẩm
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  @Public()
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
