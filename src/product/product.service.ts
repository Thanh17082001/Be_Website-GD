import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { Grade } from 'src/grade/entities/grade.entity';
import { Class } from 'src/class/entities/class.entity';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>,
    @InjectRepository(Class) private classRepo: Repository<Class>
  ){}
  async create(createProductDto: CreateProductDto, user: User): Promise<Product> {
    const { title, description, content, origin, model, trademark, code, images} = createProductDto
    const gradeId = createProductDto.gradeId ? parseInt(createProductDto.gradeId) : null;
    const classId = createProductDto.classId ? parseInt(createProductDto.classId) : null;
    // console.log(gradeId, classId)
    const grade = gradeId
      ? await this.gradeRepo.findOne({ where: { id: gradeId } })
      : null;

    const classEntity = classId
      ? await this.classRepo.findOne({ where: { id: classId } })
      : null;

    if (gradeId && !grade) {
        throw new HttpException('Grade not found', 404);
      }
    
    if (classId && !classEntity) {
        throw new HttpException('Class not found', 404);
      }
      // console.log(user)
      const product = this.repo.create({
        title,
        description,
        content,
        origin,
        model,
        trademark,
        code,
        images,
        grade,
        class: classEntity,
        createdBy: user.isAdmin ? user : null, // Nếu dùng createdBy
      });
    
      return await this.repo.save(product);
  }

  async findAll(pageOptions: PageOptionsDto, query: Partial<Product>): Promise<PageDto<Product>> {
    const queryBuilder = this.repo.createQueryBuilder('product')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.grade', 'grade')  // Join grade
      .leftJoinAndSelect('product.class', 'class'); // Join class
  
    const { page, limit, skip, order, search } = pageOptions;
    const pagination: string[] = ['page', 'limit', 'skip', 'order', 'search'];
  
    // Kiểm tra nếu có query và không phải các tham số phân trang
    if (!!query && Object.keys(query).length > 0) {
      const arrayQuery: string[] = Object.keys(query);
      arrayQuery.forEach((key) => {
        if (key && !pagination.includes(key)) {
          queryBuilder.andWhere(`product.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }
  
    // Search trong title hoặc description của sản phẩm
    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(product.title)) ILIKE LOWER(unaccent(:search)) OR LOWER(unaccent(product.description)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }
  
    // Phân trang
    queryBuilder.orderBy(`product.createdAt`, order)
      .skip(skip)
      .take(limit);
  
    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    
    // Lấy dữ liệu sau khi phân trang
    const { entities } = await queryBuilder.getRawAndEntities();
  
    // 💡 Map lại image path thành full URL (nếu có)
    const mappedEntities = entities.map((product) => {
      if (product.images && product.images.length > 0) {
        const hostUrl = process.env.HOST_API_URL || 'http://localhost:3087/api'; // Lấy từ biến môi trường
        product.images = product.images.map(image => `${hostUrl}/api/${image}`);
      }
      return product;
    });
  
    // Trả về kết quả
    return new PageDto(mappedEntities, pageMetaDto);
  }
  

  async findOne(id: number): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grade', 'class'], // Join quan hệ cần thiết
    });
  
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }
  
    // Nếu bạn cần xử lý ảnh (nếu có)
    if (product.images) {
      const hostUrl = 'http://localhost:3087/api'; // Có thể dùng biến ENV nếu cần
      product.images = product.images.map(image => `${hostUrl}/api/${image}`);
    }
  
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const existingProduct = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grade', 'class'], // Lấy quan hệ cần thiết (nếu có)
    });

    if (!existingProduct) {
      throw new BadRequestException('Không tìm thấy sản phẩm này!');
    }

    // Merge DTO vào bản ghi cũ
    const merged = this.repo.merge(existingProduct, updateProductDto);

    // Lưu bản ghi đã được cập nhật
    return await this.repo.save(merged);
  }

  async remove(id: number): Promise<Product> {
    // Tìm sản phẩm theo ID
    const product = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grade', 'class'], // Lấy các quan hệ liên quan (nếu cần)
    });

    // Nếu không tìm thấy sản phẩm, ném lỗi
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }

    // Xoá sản phẩm
    await this.repo.delete({ id });

    // Trả về sản phẩm đã bị xoá (hoặc có thể trả về một đối tượng khác nếu không cần thiết)
    return product;
  }
}
