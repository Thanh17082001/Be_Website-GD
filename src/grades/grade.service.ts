import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Grade } from './entities/grade.entity';
import { Not, Repository } from 'typeorm';
import { ItemDto, PageDto } from 'src/common/pagination/page.dto';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';
import { User } from 'src/users/entities/user.entity';
import { TypeParent } from 'src/type-parents/entities/type-parent.entity';

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(Grade) private repo: Repository<Grade>,
    @InjectRepository(TypeParent) private typeParentRepo: Repository<TypeParent>,
  ) { }
  async create(createGradeDto: CreateGradeDto, user: User): Promise<Grade> {
    const { name } = createGradeDto;
    if (await this.repo.findOne({ where: { name } })) {
      throw new HttpException('Tên đã tồn tại', 409);
    }
    const newUser = this.repo.create({
      name,
      createdBy: user
    });
    return await this.repo.save(newUser);
  }
  async findAll(pageOptions: PageOptionsDto, query: Partial<Grade>): Promise<PageDto<Grade>> {
    const queryBuilder = this.repo.createQueryBuilder('grade')
      .leftJoinAndSelect('grade.typeProducts', 'typeProducts')
      .leftJoinAndSelect('grade.subjects', 'subjects')
      .leftJoinAndSelect('grade.classes', 'classes')
      .leftJoinAndSelect('grade.categories', 'categories')
      .leftJoinAndSelect('grade.typeParents', 'typeParents');

    const { skip, limit, order = 'ASC', search } = pageOptions;
    const pagination: string[] = ['page', 'limit', 'skip', 'order', 'search'];

    if (query && Object.keys(query).length > 0) {
      Object.keys(query).forEach((key) => {
        if (!pagination.includes(key)) {
          queryBuilder.andWhere(`grade.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }

    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(grade.name)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy('grade.id', order).skip(skip).take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });


    const items = await queryBuilder.getMany();

    // Load đầy đủ quan hệ
    const fullItems = await Promise.all(items.map(async (grade) => {
      const fullGrade = await this.repo.findOne({
        where: { id: grade.id },
        relations: [
          'typeParents',
          'typeProducts',
          // 'typeProducts.grades',
          'products',
          // 'products.createdBy',
          // 'products.grades',
          'subjects',
          // 'subjects.grades',
          // 'subjects.classes',
          'classes',
          // 'classes.grade',
          // 'classes.subjects',
          'categories',
          // 'categories.grades',
        ],
      });

      // Map ảnh cho mỗi product
      // const hostUrl = process.env.HOST_API_URL || 'http://192.168.1.16:3087';
      // fullGrade?.products?.forEach((product) => {
      //   if (Array.isArray(product.images)) {
      //     product.images = product.images.map((imgPath) => `${hostUrl}/api/${imgPath}`);
      //   }
      // });

      return fullGrade!;
    }));

    return new PageDto(fullItems, pageMetaDto);
  }
  async findOne(id: number): Promise<ItemDto<Grade>> {

    const example = await this.repo.findOne({
      where: { id },
      relations: [
        'typeParents',
        'typeProducts',
        'typeProducts.createdBy',
        'typeProducts.grades',
        'products',
        'products.createdBy',
        'products.grades',
        'products.classes',
        'products.typeProduct',
        'products.categories',
        'products.subjects',
        'subjects',
        'subjects.createdBy',
        'subjects.grades',
        'subjects.products',
        'subjects.classes',
        'classes',
        'classes.createdBy',
        'classes.grade',
        'classes.subjects',
        'classes.products',
        'categories',
        'categories.createdBy',
        'categories.products',
        'categories.grades',
      ],
    });
    if (!example) {
      throw new HttpException('Not found', 404);
    }
    return new ItemDto(example);
  }
  async findByName(name: string): Promise<Grade> {

    const example = await this.repo.findOne({ where: { name } });
    if (!example) {
      throw new HttpException('Not found', 404);
    }
    return example;
  }
  async update(id: number, updateGradeDto: UpdateGradeDto) {
    const { name } = updateGradeDto;
    const exampleExits: Grade = await this.repo.findOne({ where: { name, id: Not(id) } });
    if (exampleExits) {
      throw new HttpException('Tên đã tồn tại', 409);
    }

    const example: Grade = await this.repo.findOne({ where: { id } });

    if (!example) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    Object.assign(example, updateGradeDto)

    await this.repo.update(id, example)

    return new ItemDto(example);
  }
  async filterByTypeParentAndGrade(
    pageOptions: PageOptionsDto,
    typeParentId: number,
    gradeId: number,
  ): Promise<PageDto<Grade>> {
    // Kiểm tra gradeId
    const gradeExists = await this.repo.findOne({ where: { id: gradeId } });
    if (!gradeExists) {
      throw new NotFoundException(`Không tìm thấy grade với id = ${gradeId}`);
    }

    // Kiểm tra typeParentId
    const typeParentExists = await this.typeParentRepo.findOne({ where: { id: typeParentId } });
    if (!typeParentExists) {
      throw new NotFoundException(`Không tìm thấy typeParent với id = ${typeParentId}`);
    }

    const { skip, limit, order } = pageOptions;

    const queryBuilder = this.repo.createQueryBuilder('grade')
      .leftJoin('grade.products', 'product')
      .leftJoin('product.typeParent', 'typeParent')
      .leftJoinAndSelect('grade.typeProducts', 'typeProducts')
      .leftJoinAndSelect('grade.subjects', 'subjects')
      .leftJoinAndSelect('grade.classes', 'classes')
      .leftJoinAndSelect('grade.categories', 'categories')
      .leftJoinAndSelect('grade.typeParents', 'typeParents')
      .where('grade.id = :gradeId', { gradeId })
      .orderBy('grade.id', order)
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    const items = await queryBuilder.getMany();

    const fullItems = await Promise.all(items.map(async (grade) => {
      const fullGrade = await this.repo.findOne({
        where: { id: grade.id },
        relations: [
          'products',
          'products.typeParent',
          'products.createdBy',
          'products.grades',
          'products.classes',
          'products.subjects',
          'products.typeProduct',
          'products.categories',
          'typeProducts',
          'typeProducts.typeParent', // 👈 cần thiết để lọc
          'typeParents',
          'subjects',
          'classes',
          'categories',
        ],
      });

      // Filter products theo typeParent
      if (fullGrade?.products) {
        fullGrade.products = fullGrade.products.filter(product =>
          product.typeParent && product.typeParent.id === typeParentId
        );

        fullGrade.products.forEach((product) => {
          if (Array.isArray(product.images)) {
            product.images = product.images.map(img => `api/${img}`);
          }
        });
      }

      // Filter typeProducts theo typeParent
      if (fullGrade?.typeProducts) {
        fullGrade.typeProducts = fullGrade.typeProducts.filter(tp =>
          tp.typeParent?.id === typeParentId
        );
      }

      if (fullGrade?.classes) {
        fullGrade.classes.sort((a, b) => a.id - b.id);
      }

      return fullGrade!;
    }));

    return new PageDto(fullItems, pageMetaDto);
  }
  async remove(id: number): Promise<Grade> {
    const grade = await this.repo.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!grade) {
      throw new NotFoundException('Grade không tồn tại');
    }

    await this.repo.softDelete({ id });
    return grade;
  }
  async restore(id: number): Promise<Grade> {
    const grade = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!grade) {
      throw new NotFoundException('Grade không tồn tại hoặc đã bị xoá');
    }

    await this.repo.restore(id);
    return this.repo.findOne({ where: { id } });
  }


}
