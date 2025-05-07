import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFiles, Query, UploadedFile, BadRequestException } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/role/role.decorator';
import { Product } from './entities/product.entity';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/role/role.enum';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions, storage } from 'src/config/multer';
import { ApiConsumes } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/customize.decorator';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';

@Controller('products')
@UseGuards(AuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) { }

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
    const user: User = request['user'];
    // Parse chuỗi thành mảng
    ['subjects', 'classes', 'categories', 'grades'].forEach((field) => {
      if (typeof createProductDto[field] === 'string') {
        try {
          createProductDto[field] = JSON.parse(createProductDto[field]);
        } catch {
          throw new BadRequestException(`${field} phải là mảng JSON hợp lệ`);
        }
      }
    });
    createProductDto.images = files.map(file => `public/product/image/${file.filename}`);
    // console.log(createProductDto)

    return await this.productService.create(createProductDto, user);
  }

  @Get()
  @Public()
  async findAll(@Query() pageOptionsDto: PageOptionsDto, @Req() request: Request) {
    const user = request['user'] ?? null; // Lấy user từ request (nếu có)
    return this.productService.findAll(pageOptionsDto, user); // Gọi service để lấy danh sách sản phẩm
  }
  @Get('filterproducts')
  @Public()
  async filterProducts(@Query() query: any) {
    return this.productService.filterProducts(query);
  }
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: storage('product', true),
      ...multerOptions,
    })
  )
  @Public()
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[], // optional nếu có file
    @Body() updateProductDto: UpdateProductDto
  ) {
    // Tìm sản phẩm cũ từ DB để lấy images hiện tại
    const existingProduct = await this.productService.findOne(+id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Nếu có file, cập nhật trường images
    if (files && files.length > 0) {
      updateProductDto.images = files.map(file => `public/product/image/${file.filename}`);
    } else {
      // Nếu không có file, giữ lại images cũ
      updateProductDto.images = existingProduct.images;
    }
    const fieldsToParse = ['subjects', 'classes', 'categories', 'grades'];

    fieldsToParse.forEach(field => {
      const value = updateProductDto[field];
      if (value !== undefined) {
        if (typeof value === 'string') {
          try {
            updateProductDto[field] = JSON.parse(value);
          } catch {
            updateProductDto[field] = [parseInt(value)];
          }
        } else if (!Array.isArray(value)) {
          updateProductDto[field] = [parseInt(value)];
        }
      }
    });
    // Tiến hành gọi service để cập nhật sản phẩm
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
  @Patch('restore/:id')
  @Public()
  restore(@Param('id') id: string) {
    return this.productService.restore(+id);
  }

}
