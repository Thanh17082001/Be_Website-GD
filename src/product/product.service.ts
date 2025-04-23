import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { In, Repository } from 'typeorm';
import { Grade } from 'src/grade/entities/grade.entity';
import { Class } from 'src/class/entities/class.entity';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';
import { Subject } from 'src/subjects/entities/subject.entity';
import { TypeProduct } from 'src/type-products/entities/type-product.entity';
import { Category } from 'src/categories/entities/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(TypeProduct) private typeProductRepo: Repository<TypeProduct>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>
  ) { }
  async create(createProductDto: CreateProductDto, user: User): Promise<Product> {
    const { title, description, content, origin, model, trademark, code, images, subjects, classes, typeProductId, categoryIds } = createProductDto;
    const gradeId = createProductDto.gradeId ? parseInt(createProductDto.gradeId) : null;
    // const classId = createProductDto.classId ? parseInt(createProductDto.classId) : null;

    const grade = gradeId
      ? await this.gradeRepo.findOne({ where: { id: gradeId } })
      : null;

    // const classEntity = classId
    //   ? await this.classRepo.findOne({ where: { id: classId } })
    //   : null;

    if (gradeId && !grade) {
      throw new HttpException('Không tìm thấy cấp học', 404);
    }

    // if (classId && !classEntity) {
    //   throw new HttpException('Không tìm thấy lớp', 404);
    // }

    // Lấy các đối tượng Subject từ các ID
    let newSubjects: Subject[] = [];
    // console.log(subjects, classes)
    if (Array.isArray(subjects) && subjects.length > 0) {
      newSubjects = await this.subjectRepo.find({ where: { id: In(subjects) } });
      // console.log(subjects)
      if (newSubjects.length !== subjects.length) {
        throw new HttpException('Một hoặc nhiều môn học không tồn tại', 404);
      }
    }
    // Kiểm tra class
    let newClasses: Class[] = [];
  
    if (Array.isArray(classes) && classes.length > 0) {
      newClasses = await this.classRepo.find({ where: { id: In(classes) } });
      if (newClasses.length !== classes.length) {
        throw new HttpException('Một hoặc nhiều lớp không tồn tại', 404);
      }
    }
    // Kiểm tra typeProduct
    const typeProduct = typeProductId
      ? await this.typeProductRepo.findOne({ where: { id: parseInt(typeProductId) } })
      : null;

    if (typeProductId && !typeProduct) {
      throw new HttpException(`Không tìm thấy loại sản phẩm với ID ${typeProductId}`, 404);
    }
    //Kiểm tra categories
    let categories: Category[] = [];
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      categories = await this.categoryRepo.find({ where: { id: In(categoryIds) } })

      if (categories.length !== categoryIds.length) {
        throw new HttpException('Một hoặc nhiều danh mục không tồn tại', 404)
      }
    }
    // console.log(subjectIds,categoryIds)
    const product = {
      title,
      description,
      content,
      origin,
      model,
      trademark,
      code,
      images,
      grade,
      classes: newClasses,
      subjects: newSubjects, // Gán danh sách môn học vào sản phẩm
      typeProduct,
      categories,
      createdBy: user.isAdmin ? user : null, // Gán người tạo
    };
    // console.log(newClasses, newSubjects)
    return await this.repo.save(product);
  }


  async findAll(pageOptions: PageOptionsDto, query: Partial<Product>): Promise<PageDto<Product>> {
    const queryBuilder = this.repo.createQueryBuilder('product')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.grade', 'grade') 
      .innerJoinAndSelect('product.classes', 'classes') 
      .innerJoinAndSelect('product.subjects', 'subjects')
      .leftJoinAndSelect('product.typeProduct', 'typeProduct')
      .leftJoinAndSelect('product.categories', 'categories')
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
    // console.log(entities)
    // 💡 Map lại image path thành full URL (nếu có)
    // console.log('>>> product.subjects isArray:', (entities[1].subjects));
    const mappedEntities = entities.map((product) => {
      // console.log('>>> product.subjects isArray:', (product.subjects));
      if (product.images && product.images.length > 0) {
        const hostUrl = process.env.HOST_API_URL || 'http://localhost:3087'; // Lấy từ biến môi trường
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
      relations: ['createdBy', 'grade', 'classes', 'typeProduct', 'categories'], // Join quan hệ cần thiết
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
    const {
      title,
      description,
      content,
      origin,
      model,
      trademark,
      code,
      images,
      gradeId,
      subjects,
      classes,
      typeProductId,
      categoryIds,
    } = updateProductDto;
    console.log(updateProductDto)
    const existingProduct = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grade', 'classes', 'subjects', 'typeProduct', 'categories'],
    });
  
    if (!existingProduct) {
      throw new BadRequestException('Không tìm thấy sản phẩm này!');
    }
  
    // Gán lại grade nếu có
    if (gradeId) {
      const grade = await this.gradeRepo.findOne({ where: { id: parseInt(gradeId) } });
      if (!grade) {
        throw new NotFoundException(`Không tìm thấy cấp học với ID: ${gradeId}`);
      }
      existingProduct.grade = grade;
    }
  
    // Gán lại subjects nếu có
    if (Array.isArray(subjects) && subjects.length > 0) {
      const newSubjects = await this.subjectRepo.find({ where: { id: In(subjects) } });
      if (newSubjects.length !== subjects.length) {
        throw new BadRequestException('Một hoặc nhiều môn học không tồn tại');
      }
      existingProduct.subjects = newSubjects;
    }
  
    // Gán lại classes nếu có
    if (Array.isArray(classes) && classes.length > 0) {
      const newClasses = await this.classRepo.find({ where: { id: In(classes) } });
      if (newClasses.length !== classes.length) {
        throw new BadRequestException('Một hoặc nhiều lớp không tồn tại');
      }
      existingProduct.classes = newClasses;
    }
  
    // Gán lại typeProduct nếu có
    if (typeProductId) {
      const typeProduct = await this.typeProductRepo.findOne({
        where: { id: parseInt(typeProductId) },
      });
      if (!typeProduct) {
        throw new NotFoundException(`Không tìm thấy loại sản phẩm với ID: ${typeProductId}`);
      }
      existingProduct.typeProduct = typeProduct;
    }
  
    // Gán lại categories nếu có
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const categories = await this.categoryRepo.find({ where: { id: In(categoryIds) } });
      if (categories.length !== categoryIds.length) {
        throw new BadRequestException('Một hoặc nhiều danh mục không tồn tại');
      }
      existingProduct.categories = categories;
    }
  
    // Merge các giá trị còn lại (những trường primitive như title, code,...)
    this.repo.merge(existingProduct, {
      title,
      description,
      content,
      origin,
      model,
      trademark,
      code,
      images,
    });
  
    return await this.repo.save(existingProduct);
  }
  

  async remove(id: number): Promise<Product> {
    // Tìm sản phẩm theo ID
    const product = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grade', 'class', 'typeProduct', 'categories'], // Lấy các quan hệ liên quan (nếu cần)
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
