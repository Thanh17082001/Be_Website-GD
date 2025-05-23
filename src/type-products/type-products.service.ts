import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTypeProductDto } from './dto/create-type-product.dto';
import { UpdateTypeProductDto } from './dto/update-type-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Not, Repository } from 'typeorm';
import { TypeProduct } from './entities/type-product.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { ItemDto, PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';
import { User } from 'src/users/entities/user.entity';
import { Grade } from 'src/grades/entities/grade.entity';
import { TypeParent } from 'src/type-parents/entities/type-parent.entity';

@Injectable()
export class TypeProductsService {
  constructor(
    @InjectRepository(TypeProduct) private repo: Repository<TypeProduct>,
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>,
    @InjectRepository(TypeParent) private typeParentrepo: Repository<TypeParent>,
  ) { }
  async create(createTypeProductDto: CreateTypeProductDto, user: User): Promise<TypeProduct> {
    const { name, images, typeParent } = createTypeProductDto;
    const gradesRaw = createTypeProductDto.grades;

    // ✅ Hàm xử lý chuyển đổi bất kỳ kiểu dữ liệu nào sang mảng số
    const parseToNumberArray = (value: any, fieldName: string): number[] => {
      try {
        if (typeof value === 'number') {
          return [value];
        }

        if (typeof value === 'string') {
          // Nếu là JSON dạng '[1,2]'
          if (value.trim().startsWith('[')) {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) throw new Error();
            return parsed.map(id => parseInt(id, 10));
          }

          // Nếu là '1'
          const parsed = parseInt(value, 10);
          if (!isNaN(parsed)) return [parsed];

          throw new Error();
        }

        if (Array.isArray(value)) {
          return value.map(id => parseInt(id, 10));
        }

        throw new Error();
      } catch {
        throw new HttpException(`${fieldName} phải là mảng số hợp lệ hoặc chuỗi`, 400);
      }
    };

    const gradeIds = gradesRaw ? parseToNumberArray(gradesRaw, 'grades') : [];

    // ✅ Xử lý typeParent nếu có
    let typeParentEntity: TypeParent = null;
    if (typeParent) {
      const typeParentId = typeof typeParent === 'string' ? parseInt(typeParent, 10) : typeParent;
      typeParentEntity = await this.typeParentrepo.findOne({ where: { id: typeParentId } });
      if (!typeParentEntity) {
        throw new HttpException('TypeParent không tồn tại', 404);
      }
    }

    // ✅ Kiểm tra trùng tên theo name + typeParent
    const isTypeProduct = await this.repo.findOne({
      where: {
        name,
        typeParent: typeParentEntity ? { id: typeParentEntity.id } : null,
      },
      relations: ['typeParent'],
    });

    if (isTypeProduct) {
      throw new HttpException('Tên đã tồn tại', 409);
    }

    // ✅ Xử lý lấy dữ liệu grades từ DB
    const newGrades = gradeIds.length
      ? await this.gradeRepo.find({ where: { id: In(gradeIds) } })
      : [];

    if (gradeIds.length && newGrades.length !== gradeIds.length) {
      throw new HttpException('Một hoặc nhiều cấp học không tồn tại', 409);
    }

    // ✅ Tạo mới TypeProduct
    const newTypeProduct = this.repo.create({
      name,
      images,
      grades: newGrades,
      typeParent: typeParentEntity,
      createdBy: user.isAdmin ? user : null,
    });

    return await this.repo.save(newTypeProduct);
  }
  async findAll(
    pageOptions: PageOptionsDto,
    rawQuery: Record<string, any>,
  ): Promise<PageDto<TypeProduct>> {
    const queryBuilder = this.repo.createQueryBuilder('typeproduct')
      .leftJoinAndSelect('typeproduct.createdBy', 'createdBy')
      .leftJoinAndSelect('typeproduct.products', 'products')
      .leftJoinAndSelect('typeproduct.typeParent', 'typeParent');

    const { page, limit, skip, order, search } = pageOptions;
    const paginationKeys = ['page', 'limit', 'skip', 'order', 'search'];

    // Lọc theo query (loại bỏ các param phân trang)
    Object.keys(rawQuery).forEach((key) => {
      if (!paginationKeys.includes(key) && rawQuery[key] !== undefined) {
        queryBuilder.andWhere(`typeproduct.${key} = :${key}`, { [key]: rawQuery[key] });
      }
    });

    // Search theo tên
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(typeproduct.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }

    // Kiểm tra frontend có truyền limit hay không để quyết định phân trang
    const hasLimit = Object.prototype.hasOwnProperty.call(rawQuery, 'limit');
    if (hasLimit) {
      queryBuilder
        .orderBy('typeproduct.createdAt', order)
        .skip(skip)
        .take(limit);
    } else {
      // Nếu không có limit, vẫn có thể order nhưng không phân trang
      queryBuilder.orderBy('typeproduct.createdAt', order);
    }

    const itemCount = await queryBuilder.getCount();

    const entities = await queryBuilder.getMany();

    // Map đường dẫn đầy đủ cho ảnh
    // const host = process.env.HOST_API_URL || '';
    // const mappedEntities = entities.map((typeproduct) => {
    //   if (typeproduct.images && !typeproduct.images.startsWith('http')) {
    //     typeproduct.images = `${host}/${typeproduct.images}`;
    //   }
    //   return typeproduct;
    // });

    // Gán grades cho từng typeproduct
    for (const typeproduct of entities) {
      const typeProductWithGrades = await this.repo.findOne({
        where: { id: typeproduct.id },
        relations: ['grades'],
      });
      typeproduct.grades = typeProductWithGrades?.grades ?? [];
    }

    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    return new PageDto(entities, pageMetaDto);
  }
  async findOne(id: number): Promise<TypeProduct> {
    const typeProduct = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grades', 'typeParent'],
    });

    if (!typeProduct) {
      throw new NotFoundException(`Không tìm thấy loại sản phẩm với ID: ${id}`);
    }

    // Gắn đường dẫn đầy đủ cho ảnh nếu tồn tại
    // if (typeProduct.images && !typeProduct.images.startsWith('http')) {
    //   const host = process.env.HOST_API_URL || 'http://192.168.1.45:3087/api';
    //   typeProduct.images = `${host}/${typeProduct.images}`;
    // }

    return typeProduct;
  }
  async update(
    id: number,
    updateTypeProductDto: UpdateTypeProductDto,
    images?: Express.Multer.File
  ): Promise<TypeProduct> {
    const { name, grades, typeParent } = updateTypeProductDto;

    // Tìm bản ghi hiện tại
    const typeProduct = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grades', 'typeParent'],
    });

    if (!typeProduct) {
      throw new NotFoundException(`Không tìm thấy loại sản phẩm với ID: ${id}`);
    }

    // Xử lý typeParent nếu có truyền vào (dùng để kiểm tra trùng tên và cập nhật)
    let newTypeParent = typeProduct.typeParent;
    if (typeParent !== undefined) {
      const typeParentId = parseInt(typeParent as string, 10);
      const foundTypeParent = await this.typeParentrepo.findOne({
        where: { id: typeParentId },
      });

      if (!foundTypeParent) {
        throw new NotFoundException('TypeParent không tồn tại');
      }
      newTypeParent = foundTypeParent;
      typeProduct.typeParent = newTypeParent; // cập nhật luôn cho entity
    }

    // Kiểm tra trùng tên trong cùng typeParent
    const existingByName = await this.repo.findOne({
      where: {
        name,
        typeParent: { id: newTypeParent?.id },
        id: Not(id), // exclude chính bản ghi này
      },
      relations: ['typeParent'],
    });

    if (existingByName) {
      throw new HttpException('Tên đã tồn tại', 409);
    }

    // Xử lý ảnh
    if (images) {
      const imageUrl = await this.uploadImage(images);
      updateTypeProductDto.images = imageUrl;
    } else {
      updateTypeProductDto.images = typeProduct.images;
    }

    // Xử lý grades nếu có truyền
    if (grades !== undefined) {
      // grades truyền vào có thể là string[] hoặc string
      let gradeIds: number[] = [];

      if (typeof grades === 'string') {
        // nếu là string JSON, parse ra mảng
        try {
          gradeIds = JSON.parse(grades).map((id: any) => parseInt(id, 10));
        } catch {
          throw new BadRequestException('Định dạng grades không hợp lệ');
        }
      } else if (Array.isArray(grades)) {
        gradeIds = grades.map((id) => parseInt(id, 10));
      } else {
        throw new BadRequestException('Grades không hợp lệ');
      }

      if (gradeIds.length === 0) {
        throw new BadRequestException('Danh sách grade không được để trống');
      }

      const gradeEntities = await this.gradeRepo.find({ where: { id: In(gradeIds) } });

      if (gradeEntities.length !== gradeIds.length) {
        throw new NotFoundException('Một hoặc nhiều grade không tồn tại');
      }

      typeProduct.grades = gradeEntities;
    }

    // Gộp các dữ liệu khác (trừ grades vì đã gán trực tiếp)
    const { grades: _, ...restDto } = updateTypeProductDto;
    const merged = this.repo.merge(typeProduct, restDto as DeepPartial<TypeProduct>);

    return this.repo.save(merged);
  }

  async uploadImage(image: Express.Multer.File): Promise<string> {
    const filePath = `public/type-product/image/${image.filename}`; // Định dạng đường dẫn lưu ảnh
    // Giả sử bạn lưu ảnh vào thư mục public hoặc thư mục nào đó trên server
    return filePath; // Trả về đường dẫn của ảnh đã lưu
  }
  async remove(id: number): Promise<TypeProduct> {
    const typeProduct = await this.repo.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!typeProduct) {
      throw new NotFoundException('TypeProduct không tồn tại');
    }

    await this.repo.softDelete({ id });
    return typeProduct;
  }
  async restore(id: number): Promise<TypeProduct> {
    const typeProduct = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!typeProduct) {
      throw new NotFoundException('TypeProduct không tồn tại hoặc đã bị xoá');
    }

    await this.repo.restore(id);
    return this.repo.findOne({ where: { id } });
  }
  private parseGradeIds(grades: string[] | string): number[] {
    let gradeIds: number[] = [];

    try {
      if (Array.isArray(grades)) {
        gradeIds = grades.map((g) => parseInt(g, 10)).filter((id) => !isNaN(id));
      } else if (typeof grades === 'string') {
        // Xử lý nếu là dạng JSON string như '[2,3]'
        if (grades.trim().startsWith('[')) {
          const parsed = JSON.parse(grades);
          if (Array.isArray(parsed)) {
            gradeIds = parsed.map((g) => parseInt(g, 10)).filter((id) => !isNaN(id));
          }
        } else {
          // Dạng "2,3"
          gradeIds = grades.split(',').map((g) => parseInt(g.trim(), 10)).filter((id) => !isNaN(id));
        }
      }
    } catch (err) {
      console.error('Error parsing grades:', err);
      gradeIds = [];
    }

    return gradeIds;
  }

}
