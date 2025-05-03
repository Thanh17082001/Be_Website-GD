import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTypeProductDto } from './dto/create-type-product.dto';
import { UpdateTypeProductDto } from './dto/update-type-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
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
    let { grades } = createTypeProductDto;
  
    // Parse grades nếu là string
    if (typeof grades === 'string') {
      try {
        grades = JSON.parse(grades); // '[2]' -> [2]
      } catch (e) {
        throw new HttpException('Định dạng grades không hợp lệ', 400);
      }
    }
  
    // Xử lý TypeParent nếu có
    let typeParentEntity: TypeParent = null;
    if (typeParent) {
      const typeParentId = typeof typeParent === 'string' ? parseInt(typeParent, 10) : typeParent;
  
      typeParentEntity = await this.typeParentrepo.findOne({ where: { id: typeParentId } });
      if (!typeParentEntity) {
        throw new HttpException('TypeParent không tồn tại', 404);
      }
    }
  
    // Kiểm tra trùng tên theo name + typeParent
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
  
    // Xử lý grades
    let gradeIds: number[] = [];
    let newGrades: Grade[] = [];
    if (Array.isArray(grades) && grades.length > 0) {
      gradeIds = grades.map(id => parseInt(id, 10));
      newGrades = await this.gradeRepo.find({ where: { id: In(gradeIds) } });
  
      if (newGrades.length !== gradeIds.length) {
        throw new HttpException('Một hoặc nhiều cấp học không tồn tại', 409);
      }
    }
  
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
    query: Partial<TypeProduct>,
  ): Promise<PageDto<TypeProduct>> {
    const queryBuilder = this.repo.createQueryBuilder('typeproduct')
      .leftJoinAndSelect('typeproduct.createdBy', 'createdBy')
      .leftJoinAndSelect('typeproduct.products', 'products')
      .innerJoinAndSelect('typeproduct.typeParent', 'typeParent');
    // .leftJoin('typeproduct.grades', 'grades'); // Dùng leftJoin để lấy grades

    const { page, limit, skip, order, search } = pageOptions;

    const paginationKeys = ['page', 'limit', 'skip', 'order', 'search'];

    // Lọc các điều kiện query
    if (query && Object.keys(query).length > 0) {
      const arrayQuery = Object.keys(query);
      arrayQuery.forEach((key) => {
        if (key && !paginationKeys.includes(key)) {
          queryBuilder.andWhere(`typeproduct.${key} = :${key}`, {
            [key]: query[key],
          });
        }
      });
    }

    // Tìm kiếm theo tên
    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(typeproduct.name)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    // Sắp xếp, phân trang
    queryBuilder
      .orderBy(`typeproduct.createdAt`, order)
      .skip(skip)
      .take(limit); // Dùng .take thay vì .limit (same effect, nhưng chuẩn TypeORM hơn)

    // Tính số lượng item
    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    // Lấy các entities
    const entities = await queryBuilder.getMany();

    // 🛠️ Map đường dẫn đầy đủ cho image
    const host = process.env.HOST_API_URL || 'http://192.168.1.45:3087/api';
    const mappedEntities = entities.map((typeproduct) => {
      if (typeproduct.images && !typeproduct.images.startsWith('http')) {
        typeproduct.images = `${host}/${typeproduct.images}`;
      }
      return typeproduct;
    });

    // Dùng vòng lặp for để gán grades cho từng typeproduct
    for (const typeproduct of mappedEntities) {
      const typeProductWithGrades = await this.repo.findOne({
        where: { id: typeproduct.id },
        relations: ['grades'],
      });

      typeproduct.grades = typeProductWithGrades?.grades ?? [];
    }

    return new PageDto(mappedEntities, pageMetaDto);
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
    if (typeProduct.images && !typeProduct.images.startsWith('http')) {
      const host = process.env.HOST_API_URL || 'http://192.168.1.45:3087/api';
      typeProduct.images = `${host}/${typeProduct.images}`;
    }

    return typeProduct;
  }
  async update(
    id: number,
    updateTypeProductDto: UpdateTypeProductDto,
    images?: Express.Multer.File
  ) {
    const { name, grades, typeParent } = updateTypeProductDto;
  
    const typeProduct = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grades', 'typeParent'],
    });
  
    if (!typeProduct) {
      throw new NotFoundException(`Không tìm thấy loại sản phẩm với ID: ${id}`);
    }
  
    // Xử lý typeParent nếu có truyền vào (dùng để kiểm tra trùng tên)
    let newTypeParent = typeProduct.typeParent;
    if (typeParent !== undefined) {
      const typeParentId = parseInt(typeParent as string, 10);
      newTypeParent = await this.typeParentrepo.findOne({
        where: { id: typeParentId },
      });
  
      if (!newTypeParent) {
        throw new NotFoundException('TypeParent không tồn tại');
      }
  
      typeProduct.typeParent = newTypeParent;
    }
  
    // Kiểm tra name trùng trong cùng typeParent
    const existingByName = await this.repo.findOne({
      where: {
        name,
        typeParent: { id: newTypeParent?.id },
        id: Not(id),
      },
      relations: ['typeParent'],
    });
  
    if (existingByName) {
      throw new HttpException('Tên đã tồn tại', 409);
    }
  
    // Xử lý hình ảnh
    if (images) {
      const imageUrl = await this.uploadImage(images);
      updateTypeProductDto.images = imageUrl;
    } else {
      updateTypeProductDto.images = typeProduct.images;
    }
  
    // Xử lý grades nếu có
    if (grades !== undefined) {
      const gradeIds = this.parseGradeIds(grades);
  
      if (gradeIds.length === 0) {
        throw new BadRequestException('Danh sách grade không hợp lệ');
      }
  
      const gradeEntities = await this.gradeRepo.find({ where: { id: In(gradeIds) } });
  
      if (gradeEntities.length !== gradeIds.length) {
        throw new NotFoundException('Một hoặc nhiều grade không tồn tại');
      }
  
      typeProduct.grades = gradeEntities;
    }
  
    // Gộp dữ liệu DTO trừ grades và typeParent
    const { grades: _, typeParent: __, ...restDto } = updateTypeProductDto;
    const merged = this.repo.merge(typeProduct, restDto);
  
    return this.repo.save(merged);
  }  
  async uploadImage(image: Express.Multer.File): Promise<string> {
    const filePath = `public/type-product/image/${image.filename}`; // Định dạng đường dẫn lưu ảnh
    // Giả sử bạn lưu ảnh vào thư mục public hoặc thư mục nào đó trên server
    return filePath; // Trả về đường dẫn của ảnh đã lưu
  }
  async remove(id: number) {
    const checkID = await this.repo.findOne({ where: { id } })

    if (!checkID) {
      throw new NotFoundException(` Không tìm thấy loại sản phẩm với ID: ${id}`)
    }
    await this.repo.delete(id)
    return new ItemDto(await this.repo.delete(id))
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
