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
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/customize.decorator';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { ImportFileExcelUser } from './dto/import-excel.dto';
import { RoleGuard } from 'src/role/role.guard';

@Controller('products')
@UseGuards(AuthGuard, RoleGuard)
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
    // console.log(files)
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

  @Post('import-excel')
  @Public()
  // @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('products'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async importExcel(@UploadedFile() file: Express.Multer.File, @Req() request: Request) {
    // console.log(file)
    const user = request['user'] ?? null;
    return this.productService.importFromExcel(file, user);
  }

  @Get()
  @Public()
  async findAll(@Query() pageOptionsDto: PageOptionsDto, @Req() request: Request) {
    const user = request['user'] ?? null; // Lấy user từ request (nếu có)
    return this.productService.findAll(pageOptionsDto, user); // Gọi service để lấy danh sách sản phẩm
  }
  @Get('filterproducts')
  @Public()
  async filterProducts(
    @Query() query: any,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    return this.productService.filterProducts(pageOptionsDto, query);
  }
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: storage('product', true),
      ...multerOptions,
    }),
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateProductDto: any
  ) {
    const existingProduct = await this.productService.findOne(+id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Parse fields nếu là JSON string
    const fieldsToParse = ['subjects', 'classes', 'categories', 'grades'];
    fieldsToParse.forEach(field => {
      if (typeof updateProductDto[field] === 'string') {
        try {
          updateProductDto[field] = JSON.parse(updateProductDto[field]);
        } catch {
          updateProductDto[field] = [parseInt(updateProductDto[field])];
        }
      } else if (!Array.isArray(updateProductDto[field]) && updateProductDto[field] !== undefined) {
        updateProductDto[field] = [parseInt(updateProductDto[field])];
      }
    });

    // Parse lại images giữ lại từ client (nếu có)
    let oldImages: string[] = [];
    if (typeof updateProductDto.images === 'string') {
      try {
        oldImages = JSON.parse(updateProductDto.images);
      } catch {
        oldImages = [updateProductDto.images];
      }
    } else if (Array.isArray(updateProductDto.images)) {
      oldImages = updateProductDto.images;
    }

    // Nếu có ảnh mới => thêm vào cuối danh sách
    const newUploadedImages = (files || []).map(file => `public/product/image/${file.filename}`);

    // Merge ảnh cũ (người dùng giữ lại) + ảnh mới
    updateProductDto.images = [...oldImages, ...newUploadedImages];

    // Gọi service
    return this.productService.update(+id, updateProductDto);
  }



  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
  @Patch('restore/:id')
  @Roles(Role.ADMIN)
  restore(@Param('id') id: string) {
    return this.productService.restore(+id);
  }

}
