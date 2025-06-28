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
const path = require('path');
import { generateThumbnail } from 'src/utils/image';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeProduct } from 'src/type-products/entities/type-product.entity';
import { Repository } from 'typeorm';
const fs = require('fs');
const sharp = require('sharp');

@Controller('products')
@UseGuards(AuthGuard, RoleGuard)
export class ProductController {
  constructor(private readonly productService: ProductService, @InjectRepository(TypeProduct) private typeProductRepo: Repository<TypeProduct>,) { }

  @Post()
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: storage('product', true),
      ...multerOptions,
    }),
  )
  async create(
    @Body() createProductDto: CreateProductDto,
    @Req() request: Request,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const user: User = request['user'];

    // Parse các field dạng JSON
    ['subjects', 'classes', 'categories', 'grades'].forEach((field) => {
      if (typeof createProductDto[field] === 'string') {
        try {
          createProductDto[field] = JSON.parse(createProductDto[field]);
        } catch {
          throw new BadRequestException(`${field} phải là mảng JSON hợp lệ`);
        }
      }
    });

    // Xử lý ảnh và thumbnail
    const imagePaths: string[] = [];
    const thumbnailPaths: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const fullImagePath = `public/product/image/${file.filename}`;
        const fullImageAbsolutePath = file.path; // Đường dẫn tuyệt đối
        // console.log(fullImageAbsolutePath)
        const thumbAbsolutePath = await generateThumbnail(fullImageAbsolutePath);
        const thumbRelativePath = fullImagePath.replace(file.filename, path.basename(thumbAbsolutePath));

        imagePaths.push(fullImagePath);
        thumbnailPaths.push(thumbRelativePath);
      }
    } else {
      const { typeProduct } = createProductDto
      const typeProductId = typeProduct ? parseInt(typeProduct) : null;
      const newTypeProduct = typeProductId
        ? await this.typeProductRepo.findOne({ where: { id: typeProductId } })
        : null;
      // console.log(newTypeProduct)
      switch (newTypeProduct.name) {
        case 'Tranh giấy, Tranh nhựa':
          imagePaths.push('public/product/image/default1.jpg');
          thumbnailPaths.push('public/product/image/default1_thumb.jpg');
          break;
        case 'Video':
          imagePaths.push('public/product/image/default2.jpg');
          thumbnailPaths.push('public/product/image/default2_thumb.jpg');
          break;
        case 'Thiết bị tối thiểu':
          imagePaths.push('public/product/image/default3.jpg');
          thumbnailPaths.push('public/product/image/default3_thumb.jpg');
          break;
        case 'Thiết bị nghe nhìn':
          imagePaths.push('public/product/image/default4.jpg');
          thumbnailPaths.push('public/product/image/default4_thumb.jpg');
          break;
        case 'Học liệu điện tử':
          imagePaths.push('public/product/image/default5.jpg');
          thumbnailPaths.push('public/product/image/default5_thumb.jpg');
          break;
        case 'Thiết bị cơ bản':
          imagePaths.push('public/product/image/default6.jpg');
          thumbnailPaths.push('public/product/image/default6_thumb.jpg');
          break;
        case 'Thiết bị khác':
          imagePaths.push('public/product/image/default7.jpg');
          thumbnailPaths.push('public/product/image/default7_thumb.jpg');
          break;
        case 'Thiết bị dùng chung':
          imagePaths.push('public/product/image/default8.jpg');
          thumbnailPaths.push('public/product/image/default8_thumb.jpg');
          break;
          case 'Phần mềm 3D':
          imagePaths.push('public/product/image/default9.jpg');
          thumbnailPaths.push('public/product/image/default9_thumb.jpg');
          break;
        default:
          imagePaths.push('public/product/image/default.jpg');
          thumbnailPaths.push('public/product/image/default_thumb.jpg');          
          break;
      }
    }

    createProductDto.images = imagePaths;
    createProductDto['thumbnails'] = thumbnailPaths;

    return await this.productService.create(createProductDto, user);
  }
  @Get('testthubnail')
  @Public()
  async test() {
    return await this.productService.generateThumbnailsForExistingProducts()
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
    // Parse các field dạng JSON
    const fieldsToParse = ['subjects', 'classes', 'categories', 'grades'];
    fieldsToParse.forEach(field => {
      // console.log(updateProductDto[field])
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

    // Parse lại ảnh cũ giữ lại
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
    // console.log(updateProductDto.images)
    // Ảnh mới upload
    const newUploadedImages = (files || []).map(file => `public/product/image/${file.filename}`);

    // Gộp ảnh cũ + mới
    const allImages = [...oldImages, ...newUploadedImages];
    updateProductDto.images = allImages;

    // === TẠO THUMBNAIL ===
    const publicFolder = path.join(__dirname, '..', '..', 'public');
    const thumbnails: string[] = [];

    for (const imageRelPath of allImages) {
      const rel = imageRelPath.startsWith('public/') ? imageRelPath.slice(7) : imageRelPath;
      const imagePath = path.join(publicFolder, rel);
      // console.log(imagePath)
      if (!fs.existsSync(imagePath)) {
        console.warn(`⚠️ Image file does not exist: ${imagePath}`);
        continue;
      }

      const parsed = path.parse(rel);
      const thumbName = parsed.name + '_thumb' + parsed.ext;
      const thumbRelPath = path.join(parsed.dir, thumbName);
      const thumbPath = path.join(publicFolder, thumbRelPath);

      // Tạo nếu chưa tồn tại
      if (!fs.existsSync(thumbPath)) {
        try {
          await sharp(imagePath).resize(300).jpeg({ quality: 70 }).toFile(thumbPath);
          console.log(`✅ Created thumbnail: ${thumbPath}`);
        } catch (err) {
          console.error(`❌ Failed to create thumbnail for ${imagePath}:`, err);
          continue;
        }
      }

      thumbnails.push(`public/${thumbRelPath.replace(/\\/g, '/')}`); // normalize path
    }

    updateProductDto.thumbnails = thumbnails;

    // Cập nhật
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
