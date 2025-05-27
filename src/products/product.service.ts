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
import { TypeParent } from 'src/type-parents/entities/type-parent.entity';
import * as xlsx from 'xlsx';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(TypeProduct) private typeProductRepo: Repository<TypeProduct>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(TypeParent) private typeParentRepo: Repository<TypeParent>,
  ) { }
  async create(createProductDto: CreateProductDto, user: User) {
    const {
      title,
      description,
      content,
      apply,
      origin,
      model,
      trademark,
      code,
      images,
      grades, // Mảng grades
      subjects,
      classes,
      typeProduct,
      typeParent,  // Thêm typeParent vào DTO
      categories,
    } = createProductDto;
    // console.log('---- Debug input ----');
    // console.log('grades:', grades, 'type:', typeof grades);
    // console.log('subjects:', subjects, 'type:', typeof subjects);
    // console.log('classes:', classes, 'type:', typeof classes);
    // console.log('categories:', categories, 'type:', typeof categories);
    // console.log('----------------------');
    const parseToArray = (value: any): number[] => {
      if (!value) return [];

      // Nếu là số đơn
      if (typeof value === 'number') {
        return [value];
      }

      // Nếu là mảng
      if (Array.isArray(value)) {
        return value.map((id) => parseInt(id));
      }

      // Nếu là chuỗi JSON hoặc chuỗi số
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.map((id) => parseInt(id));
          }
        } catch {
          // Nếu là chuỗi số đơn giản như "1"
          if (/^\d+$/.test(value)) {
            return [parseInt(value)];
          }
        }
      }

      throw new HttpException('Dữ liệu phải là mảng hợp lệ hoặc chuỗi ID', 400);
    };



    const subjectIds = parseToArray(subjects);
    const classIds = parseToArray(classes);
    const categoryIds = parseToArray(categories);
    const gradeIds = parseToArray(grades);

    // === Lấy dữ liệu từ DB ===
    const newGrades = gradeIds.length
      ? await this.gradeRepo.find({ where: { id: In(gradeIds) } })
      : [];

    if (gradeIds.length !== newGrades.length) {
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

    // === Xử lý typeParent ===
    const typeParentId = typeParent ? parseInt(typeParent) : null;  // Chuyển typeParent thành ID
    const newTypeParent = typeParentId
      ? await this.typeParentRepo.findOne({ where: { id: typeParentId } })
      : null;

    if (typeParentId && !newTypeParent) {
      throw new HttpException(`Không tìm thấy TypeParent với ID ${typeParentId}`, 404);
    }

    // === Tạo mới sản phẩm ===
    const product = this.repo.create({
      title,
      description,
      content,
      apply,
      origin,
      model,
      trademark,
      code,
      images,  // Mảng hình ảnh
      grades: newGrades,  // Lưu grades
      classes: newClasses,
      subjects: newSubjects,
      typeProduct: newTypeProduct,
      typeParent: newTypeParent,  // Lưu typeParent vào sản phẩm
      categories: newCategories,
      createdBy: user.isAdmin ? user : null,
    });

    return await this.repo.save(product);
  }
  async findAll(pageOptions: PageOptionsDto, query: Partial<Product>): Promise<PageDto<Product>> {
    const queryBuilder = this.repo.createQueryBuilder('product')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.grades', 'grades')
      .leftJoinAndSelect('product.typeParent', 'typeParent');

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

    // Phân trang và sắp xếp theo ID
    queryBuilder.orderBy(`product.id`, order)
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    const items = await queryBuilder.getMany();

    // Load thêm các quan hệ còn lại
    for (const product of items) {
      const fullProduct = await this.repo.findOne({
        where: { id: product.id },
        relations: ['classes', 'subjects', 'typeProduct', 'categories', 'typeParent'],
      });

      product.classes = fullProduct?.classes ?? [];
      product.subjects = fullProduct?.subjects ?? [];
      product.typeProduct = fullProduct?.typeProduct ?? null;
      product.categories = fullProduct?.categories ?? [];
    }

    // Gắn URL đầy đủ cho ảnh
    // const hostUrl = process.env.HOST_API_URL || '';
    // const mappedEntities = items.map((product) => {
    //   if (product.images && product.images.length > 0) {
    //     product.images = product.images.map(image => `${hostUrl}/api/${image}`);
    //   }
    //   return product;
    // });

    return new PageDto(items, pageMetaDto);
  }
  async findOne(id: number): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grades', 'classes', 'typeProduct', 'categories', 'subjects', 'typeParent'], // Join quan hệ cần thiết
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }

    // Nếu bạn cần xử lý ảnh (nếu có)
    // if (product.images) {
    //   const hostUrl = 'http://192.168.1.45:3087'; // Có thể dùng biến ENV nếu cần
    //   product.images = product.images.map(image => `${hostUrl}/api/${image}`);
    // }

    return product;
  }
  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const {
      title,
      description,
      content,
      apply,
      origin,
      model,
      trademark,
      code,
      images,
      grades,
      subjects,
      classes,
      typeProduct,
      typeParent,
      categories,
    } = updateProductDto;

    const existingProduct = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grades', 'classes', 'subjects', 'typeProduct', 'typeParent', 'categories'],
    });

    if (!existingProduct) {
      throw new BadRequestException('Không tìm thấy sản phẩm này!');
    }

    // Xử lý grades
    if (grades && grades.length > 0) {
      const gradeIds = grades.map(id => parseInt(id));
      const newGrades = await this.gradeRepo.find({ where: { id: In(gradeIds) } });
      if (newGrades.length !== gradeIds.length) {
        throw new BadRequestException('Một hoặc nhiều cấp học không tồn tại');
      }
      existingProduct.grades = newGrades;
    }

    // Xử lý subjects
    if (subjects && subjects.length > 0) {
      const subjectIds = subjects.map(id => parseInt(id));
      const newSubjects = await this.subjectRepo.find({ where: { id: In(subjectIds) } });
      if (newSubjects.length !== subjectIds.length) {
        throw new BadRequestException('Một hoặc nhiều môn học không tồn tại');
      }
      existingProduct.subjects = newSubjects;
    }

    // Xử lý classes
    if (classes && classes.length > 0) {
      const classIds = classes.map(id => parseInt(id));
      const newClasses = await this.classRepo.find({ where: { id: In(classIds) } });
      if (newClasses.length !== classIds.length) {
        throw new BadRequestException('Một hoặc nhiều lớp không tồn tại');
      }
      existingProduct.classes = newClasses;
    }

    // Xử lý typeProduct
    if (typeProduct) {
      const typeProductId = parseInt(typeProduct);
      const newTypeProduct = await this.typeProductRepo.findOne({ where: { id: typeProductId } });
      if (!newTypeProduct) {
        throw new NotFoundException(`Không tìm thấy loại sản phẩm với ID: ${typeProduct}`);
      }
      existingProduct.typeProduct = newTypeProduct;
    }

    // Xử lý typeParent
    if (typeParent) {
      const typeParentId = parseInt(typeParent);
      const newTypeParent = await this.typeParentRepo.findOne({ where: { id: typeParentId } });
      if (!newTypeParent) {
        throw new NotFoundException(`Không tìm thấy typeParent với ID: ${typeParent}`);
      }
      existingProduct.typeParent = newTypeParent;
    }

    // Xử lý categories
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

    // Cập nhật các trường còn lại
    this.repo.merge(existingProduct, {
      title,
      description,
      content,
      apply,
      origin,
      model,
      trademark,
      code,
      images, // đã merge từ controller
    });

    return await this.repo.save(existingProduct);
  }
  async filterProducts(pageOptions: PageOptionsDto, query: any): Promise<PageDto<Product>> {
    const queryBuilder = this.repo.createQueryBuilder('product')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.grades', 'grades')
      .leftJoinAndSelect('product.classes', 'classes')
      .leftJoinAndSelect('product.subjects', 'subjects')
      .leftJoinAndSelect('product.typeProduct', 'typeProduct')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.typeParent', 'typeParent');

    const { page, limit, skip, order, search } = pageOptions;

    const parseIds = (param: string, label: string): number[] => {
      return param.split(',').map((id: string) => {
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
          throw new BadRequestException(`Invalid ${label} ID: ${id}`);
        }
        return parsedId;
      });
    };

    if (query.gradeId) {
      const gradeIds = parseIds(query.gradeId, 'grade');
      queryBuilder.andWhere('grades.id IS NOT NULL AND grades.id IN (:...gradeIds)', { gradeIds });
    }

    if (query.classes) {
      const classIds = parseIds(query.classes, 'class');
      queryBuilder.andWhere('classes.id IS NOT NULL AND classes.id IN (:...classIds)', { classIds });
    }

    if (query.subjects) {
      const subjectIds = parseIds(query.subjects, 'subject');
      queryBuilder.andWhere('subjects.id IS NOT NULL AND subjects.id IN (:...subjectIds)', { subjectIds });
    }

    if (query.typeProducts) {
      const typeProductIds = parseIds(query.typeProducts, 'type product');
      queryBuilder.andWhere('typeProduct.id IS NOT NULL AND typeProduct.id IN (:...typeProductIds)', { typeProductIds });
    }

    if (query.categories) {
      const categoryIds = parseIds(query.categories, 'category');
      queryBuilder.andWhere('categories.id IS NOT NULL AND categories.id IN (:...categoryIds)', { categoryIds });
    }

    // if (query.typeParentId) {
    //   const typeParentIds = parseIds(query.typeParentId, 'type parent');
    //   queryBuilder.andWhere('typeParent.id IS NOT NULL AND typeParent.id IN (:...typeParentIds)', { typeParentIds });
    // }
    if (query.typeParentId) {
      const typeParentIds = parseIds(query.typeParentId, 'type parent');
      queryBuilder.innerJoin('product.typeParent', 'filterTypeParent', 'filterTypeParent.id IN (:...typeParentIds)', { typeParentIds });
    }
    // Tìm kiếm theo title hoặc description
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(product.title)) ILIKE LOWER(unaccent(:search)) OR LOWER(unaccent(product.code)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }
    // Sắp xếp và phân trang
    queryBuilder.orderBy('product.id', order)
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    const items = await queryBuilder.getMany();

    // Load lại quan hệ đầy đủ
    for (const product of items) {
      const fullProduct = await this.repo.findOne({
        where: { id: product.id },
        relations: ['classes', 'subjects', 'typeProduct', 'categories', 'typeParent'],
      });

      product.classes = fullProduct?.classes ?? [];
      product.subjects = fullProduct?.subjects ?? [];
      product.typeProduct = fullProduct?.typeProduct ?? null;
      product.categories = fullProduct?.categories ?? [];
      product.typeParent = fullProduct?.typeParent ?? null;
    }

    // // Gắn lại đường dẫn ảnh đầy đủ
    // const hostUrl = process.env.HOST_API_URL || '';
    // const mappedEntities = items.map((product) => {
    //   if (product.images && product.images.length > 0) {
    //     product.images = product.images.map(image => `${hostUrl}/api/${image}`);
    //   }
    //   return product;
    // });

    return new PageDto(items, pageMetaDto);
  }
  async remove(id: number): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!product) {
      throw new NotFoundException('Product không tồn tại');
    }

    await this.repo.softDelete({ id });
    return product;
  }
  async restore(id: number): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException('Product không tồn tại hoặc đã bị xoá');
    }

    await this.repo.restore(id);
    return this.repo.findOne({ where: { id } });
  }
  async importFromExcel(file: Express.Multer.File, user: User) {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet);
    // console.log(rows)
    for (const row of rows) {
      const {
        title,
        description,
        content,
        apply,
        origin,
        model,
        trademark,
        code,
        images,
        typeProduct,
        typeParent,
        categories,
      } = row;
      const grades = [];
      for (const gradeName of this.parseStringArray(row.grades)) {
        const grade = await this.gradeRepo.findOne({ where: { name: gradeName } });
        if (grade) grades.push(grade);
      }
      let typeProductEntity = await this.typeProductRepo.findOne({
        where: {
          name: typeProduct,
          typeParent: { name: typeParent },
        },
        relations: ['grades', 'typeParent'],
      });
      if (!typeProductEntity) {
        // Nếu chưa có, tạo mới với image mặc định
        const typeParentEntity = typeParent
          ? await this.typeParentRepo.findOne({ where: { name: typeParent } })
          : null;

        typeProductEntity = this.typeProductRepo.create({
          name: typeProduct,
          images: 'public/type-product/image/default.png',
          typeParent: typeParentEntity,
          grades: grades,
        });
        await this.typeProductRepo.save(typeProductEntity);
      } else {
        // Nếu đã có, cập nhật thêm grade nếu thiếu
        typeProductEntity.grades = typeProductEntity.grades || [];
        for (const grade of grades) {
          if (!typeProductEntity.grades.find(g => g.id === grade.id)) {
            typeProductEntity.grades.push(grade);
          }
        }

        // Cập nhật typeParent nếu chưa có
        if (!typeProductEntity.typeParent && typeParent) {
          const typeParentEntity = await this.typeParentRepo.findOne({ where: { name: typeParent } });
          if (typeParentEntity) {
            typeProductEntity.typeParent = typeParentEntity;
          }
        }

        await this.typeProductRepo.save(typeProductEntity);
      }
      const typeParentEntity = (
        typeParent ? await this.typeParentRepo.findOne({ where: { name: typeParent } }) : null
      );
      const classes = [];
      for (const className of this.parseStringArray(row.classes)) {
        const classEntity = await this.classRepo.findOne({ where: { name: className } });
        if (classEntity) classes.push(classEntity);
      }
      const subjects = this.parseStringArray(row.subjects)
      // console.log(typeof(grades), typeof(classes), subjects, row.typeProduct)
      // ======== Subjects ========
      const subjectEntities = [];
      for (const subjectName of subjects) {
        let subject = await this.subjectRepo.findOne({
          where: { name: subjectName },
          relations: ['grades', 'classes'],
        });
        if (!subject) {
          subject = this.subjectRepo.create({ name: subjectName, grades: grades, classes: classes });
          await this.subjectRepo.save(subject);
        } else {
          subject.grades = subject.grades || [];
          for (const grade of grades) {
            if (!subject.grades.find(g => g.id === grade.id)) {
              subject.grades.push(grade)
            }
          }
          subject.classes = subject.classes || [];
          for (const cl of classes) {
            if (!subject.classes.find(c => c.id === cl.id)) {
              subject.classes.push(cl);
            }
          }
          await this.subjectRepo.save(subject);
        }
        subjectEntities.push(subject);
      }
      const categoryNames = this.parseStringArray(categories);

      const newCategories = [];
      for (const categoryName of categoryNames) {
        const category = await this.categoryRepo.findOne({ where: { name: categoryName } });
        if (category) {
          newCategories.push(category);
        }
      }
      // Lấy tất cả sản phẩm trùng title, description, content, apply, origin, model, trademark, code
      const existingProducts = await this.repo.find({
        where: {
          title,
          description,
          content,
          apply,
          origin,
          model,
          trademark,
          code,
          typeProduct: typeProductEntity ? { id: typeProductEntity.id } : null,
          typeParent: typeParentEntity ? { id: typeParentEntity.id } : null,
        },
        relations: ['grades', 'classes', 'subjects', 'categories', 'typeProduct'],
      });
      // Hàm so sánh 2 mảng name đã sắp xếp
      const compareNameArrays = (a: { name: string }[], b: { name: string }[]) => {
        const namesA = a.map(e => e.name).sort();
        const namesB = b.map(e => e.name).sort();
        return namesA.length === namesB.length && namesA.every((val, idx) => val === namesB[idx]);
      };
      let isDuplicate = false;
      for (const product of existingProducts) {
        if (
          compareNameArrays(product.grades, grades) &&
          compareNameArrays(product.classes, classes) &&
          compareNameArrays(product.subjects, subjectEntities) &&
          compareNameArrays(product.categories, newCategories)
        ) {
          isDuplicate = true;
          break;
        }
      }

      if (isDuplicate) {
        continue; // Bỏ qua sản phẩm trùng
      }

      const newProduct = this.repo.create({
        title,
        description,
        content,
        apply,
        origin,
        model,
        trademark,
        code,
        images: ['public/product/image/default.png'],
        subjects: subjectEntities,
        grades,
        classes,
        typeProduct: typeProductEntity,
        typeParent: typeParentEntity,
        categories: newCategories,
        createdBy: user,
      });

      await this.repo.save(newProduct);

    }
    return { message: 'Import thành công' };
  }
  parseStringArray(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (value !== null && value !== undefined) {
      return String(value)
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    return [];
  }
}
