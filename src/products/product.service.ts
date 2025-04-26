import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { In, Repository } from 'typeorm';
import { Grade } from 'src/grades/entities/grade.entity';
import { Class } from 'src/classes/entities/class.entity';
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
  async create(createProductDto: CreateProductDto, user: User) {
    const {
      title,
      description,
      content,
      origin,
      model,
      trademark,
      code,
      images,
      grades, // Mảng grades
      subjects,
      classes,
      typeProduct,
      categories,
    } = createProductDto;

    const parseToArray = (value: any): number[] => {
      try {
        if (typeof value === 'string') {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
          return parsed.map(id => parseInt(id));
        }
        if (Array.isArray(value)) {
          return value.map(id => parseInt(id));
        }
        return [];
      } catch {
        throw new HttpException('Dữ liệu phải là mảng hợp lệ', 400);
      }
    };
  
    const subjectIds = parseToArray(subjects);
    const classIds = parseToArray(classes);
    const categoryIds = parseToArray(categories);
    const gradeIds = parseToArray(grades);
  
    // === Lấy dữ liệu từ DB ===
    const newGrades = gradeIds.length
      ? await this.gradeRepo.find({where: {id: In(gradeIds)}})
      : [];
    // console.log(gradeIds)
    if(gradeIds.length !== newGrades.length) {
      throw new HttpException('Một hoặc nhiều cấp không tồn tại', 404);
    }


    const newSubjects = subjectIds.length
      ? await this.subjectRepo.find({ where: { id: In(subjectIds) } })
      : [];
  
    if (subjectIds.length !== newSubjects.length) {
      throw new HttpException('Một hoặc nhiều môn học không tồn tại', 404);
    }
  
    const newClasses = classIds.length
      ? await this.classRepo.find({ where: { id: In(classIds) } })
      : [];
  
    if (classIds.length !== newClasses.length) {
      throw new HttpException('Một hoặc nhiều lớp không tồn tại', 404);
    }
  
    const typeProductId = typeProduct ? parseInt(typeProduct) : null;
    const newTypeProduct = typeProductId
      ? await this.typeProductRepo.findOne({ where: { id: typeProductId } })
      : null;
  
    if (typeProductId && !newTypeProduct) {
      throw new HttpException(`Không tìm thấy loại sản phẩm với ID ${typeProductId}`, 404);
    }
  
    const newCategories = categoryIds.length
      ? await this.categoryRepo.find({ where: { id: In(categoryIds) } })
      : [];
  
    if (categoryIds.length !== newCategories.length) {
      throw new HttpException('Một hoặc nhiều danh mục không tồn tại', 404);
    }
  
    // === Tạo mới sản phẩm ===
    const product = this.repo.create({
      title,
      description,
      content,
      origin,
      model,
      trademark,
      code,
      images,  // Đây là mảng hình ảnh được lấy từ files đã upload
      grades: newGrades,  // Lưu grades
      classes: newClasses,
      subjects: newSubjects,
      typeProduct: newTypeProduct,
      categories: newCategories,
      createdBy: user.isAdmin ? user : null,
    });
    // console.log(product)
    return await this.repo.save(product);
  } 

  async findAll(pageOptions: PageOptionsDto, query: Partial<Product>): Promise<PageDto<Product>> {
    const queryBuilder = this.repo.createQueryBuilder('product')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.grades', 'grades'); // Load các quan hệ cần thiết cơ bản

    const { page, limit, skip, order, search } = pageOptions;
    const pagination: string[] = ['page', 'limit', 'skip', 'order', 'search'];

    // Lọc theo query
    if (!!query && Object.keys(query).length > 0) {
      const arrayQuery: string[] = Object.keys(query);
      arrayQuery.forEach((key) => {
        if (key && !pagination.includes(key)) {
          queryBuilder.andWhere(`product.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }

    // Tìm kiếm theo title hoặc description
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(product.title)) ILIKE LOWER(unaccent(:search)) OR LOWER(unaccent(product.description)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }

    // Phân trang
    queryBuilder.orderBy(`product.createdAt`, order)
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    const items = await queryBuilder.getMany();

    // Load 4 quan hệ còn lại: classes, subjects, typeProduct, categories
    for (const product of items) {
      const fullProduct = await this.repo.findOne({
        where: { id: product.id },
        relations: ['classes', 'subjects', 'typeProduct', 'categories'],
      });

      product.classes = fullProduct?.classes ?? [];
      product.subjects = fullProduct?.subjects ?? [];
      product.typeProduct = fullProduct?.typeProduct ?? null;
      product.categories = fullProduct?.categories ?? [];
    }

    // Map lại images thành URL đầy đủ
    const hostUrl = process.env.HOST_API_URL || 'http://192.168.1.45:3087';
    const mappedEntities = items.map((product) => {
      if (product.images && product.images.length > 0) {
        product.images = product.images.map(image => `${hostUrl}/api/${image}`);
      }
      return product;
    });

    return new PageDto(mappedEntities, pageMetaDto);
  }


  async findOne(id: number): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grades', 'classes', 'typeProduct', 'categories', 'subjects'], // Join quan hệ cần thiết
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }

    // Nếu bạn cần xử lý ảnh (nếu có)
    if (product.images) {
      const hostUrl = 'http://192.168.1.45:3087'; // Có thể dùng biến ENV nếu cần
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
      grades, // Mảng grades
      subjects,
      classes,
      typeProduct,
      categories,
    } = updateProductDto;
  
    // Lấy sản phẩm hiện tại từ DB
    const existingProduct = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grade', 'classes', 'subjects', 'typeProduct', 'categories'],
    });
  
    if (!existingProduct) {
      throw new BadRequestException('Không tìm thấy sản phẩm này!');
    }
  
    // Xử lý và gán lại grades nếu có
    if (grades && grades.length > 0) {
      const gradeIds = grades.map(id => parseInt(id));
      const newGrades = await this.gradeRepo.find({ where: { id: In(gradeIds) } });
      if (newGrades.length !== gradeIds.length) {
        throw new BadRequestException('Một hoặc nhiều cấp học không tồn tại');
      }
      existingProduct.grades = newGrades; // Cập nhật grade
    }
  
    // Gán lại subjects nếu có
    if (subjects && subjects.length > 0) {
      const subjectIds = subjects.map(id => parseInt(id));
      const newSubjects = await this.subjectRepo.find({ where: { id: In(subjectIds) } });
      if (newSubjects.length !== subjectIds.length) {
        throw new BadRequestException('Một hoặc nhiều môn học không tồn tại');
      }
      existingProduct.subjects = newSubjects;
    }
  
    // Gán lại classes nếu có
    if (classes && classes.length > 0) {
      const classIds = classes.map(id => parseInt(id));
      const newClasses = await this.classRepo.find({ where: { id: In(classIds) } });
      if (newClasses.length !== classIds.length) {
        throw new BadRequestException('Một hoặc nhiều lớp không tồn tại');
      }
      existingProduct.classes = newClasses;
    }
  
    // Gán lại typeProduct nếu có
    if (typeProduct) {
      const typeProductId = parseInt(typeProduct);
      const newTypeProduct = await this.typeProductRepo.findOne({ where: { id: typeProductId } });
      if (!newTypeProduct) {
        throw new NotFoundException(`Không tìm thấy loại sản phẩm với ID: ${typeProduct}`);
      }
      existingProduct.typeProduct = newTypeProduct;
    }
  
    // Gán lại categories nếu có
    if (categories && categories.length > 0) {
      const categoryIds = Array.isArray(categories)
        ? categories.map(id => parseInt(id))
        : [parseInt(categories)];
  
      const newCategories = await this.categoryRepo.find({ where: { id: In(categoryIds) } });
      if (newCategories.length !== categoryIds.length) {
        throw new BadRequestException('Một hoặc nhiều danh mục không tồn tại');
      }
      existingProduct.categories = newCategories;
    }
  
    // Merge các giá trị primitive (chuỗi, mảng ảnh,...)
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
  
    // Lưu lại thông tin đã cập nhật
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
