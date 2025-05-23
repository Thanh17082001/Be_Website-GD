import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { In, Not, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Product } from 'src/products/entities/product.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';
import { Grade } from 'src/grades/entities/grade.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
    @InjectRepository(Product) private repoProduct: Repository<Product>,
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>,
  ) { }
  // : Promise<Category>
  async create(createCategoryDto: CreateCategoryDto, user: User) {
    const { name, grades } = createCategoryDto;
    console.log(grades)
    const checkName = await this.repo.findOne({ where: { name } })
    if (checkName) {
      throw new HttpException('Tên danh mục đã tồn tại', 409)
    }

    let newGrades: Grade[] = [];
    if (Array.isArray(grades) && grades.length > 0) {
      const gradeIds = grades.map(id => Number(id));
      newGrades = await this.gradeRepo.findBy({ id: In(gradeIds) });

      if (newGrades.length !== gradeIds.length) {
        throw new HttpException('Một hoặc nhiều cấp học không tồn tại', 404);
      }
    }
    const newCategory = {
      name,
      // products: newProducts,
      grades: newGrades
    }
    // console.log(newCategory)
    return await this.repo.save(newCategory)

  }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Category>
  ): Promise<PageDto<Category>> {
    const queryBuilder = this.repo.createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'products')
      .leftJoinAndSelect('category.grades', 'grades')

    const { page, limit, skip, order, search } = pageOptions;
    const paginationParams = ['page', 'limit', 'skip', 'order', 'search'];

    // Áp dụng filter theo query (ví dụ name, createdBy,...)
    // if (query && Object.keys(query).length > 0) {
    //   Object.keys(query).forEach((key) => {
    //     if (!paginationParams.includes(key) && query[key] !== undefined) {
    //       queryBuilder.andWhere(`category.${key} = :${key}`, { [key]: query[key] });
    //     }
    //   });
    // }

    // Search theo tên danh mục
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(category.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy('category.createdAt', order)
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(entities, pageMetaDto);
  }
  async findOne(id: number): Promise<Category> {
    const category = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'products', 'grades'],
    })

    if (!category) {
      throw new NotFoundException(` Không tìm thấy danh mục với ID: ${id}`)
    }

    return category
  }
  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    // console.log(id)
    const { name, grades } = updateCategoryDto

    const existingCategory = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'products', 'grades']
    })

    if (!existingCategory) {
      throw new NotFoundException('Không tìm thấy danh mục này!');
    }

    const checkName = await this.repo.findOne({
      where: {
        name,
        id: Not(id)
      }
    })

    if (checkName) {
      throw new BadRequestException('Tên danh mục đã tồn tại')
    }
    if (name) {
      existingCategory.name = name
    }

    if (grades && Array.isArray(grades)) {
      const gradeIds = grades.map(id => Number(id));
      const newGrades = await this.gradeRepo.find({
        where: { id: In(gradeIds) },
      });

      if (newGrades.length !== gradeIds.length) {
        throw new NotFoundException('Một hoặc nhiều cấp học không tồn tại');
      }

      existingCategory.grades = newGrades;
    }
    // console.log(existingCategory)
    return await this.repo.save(existingCategory);

  }
  async remove(id: number): Promise<Category> {
    const category = await this.repo.findOne({
      where: { id },
      // relations: ['createdBy'],
    });

    if (!category) {
      throw new NotFoundException('Category không tồn tại');
    }

    await this.repo.softDelete({ id });
    return category;
  }
  async restore(id: number): Promise<Category> {
    const category = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!category) {
      throw new NotFoundException('Category không tồn tại hoặc đã bị xoá');
    }

    await this.repo.restore(id);
    return this.repo.findOne({ where: { id } });
  }
  async findByDeleted(
    pageOptions: PageOptionsDto,
    query: Partial<Category>
  ): Promise<PageDto<Category>> {
    const queryBuilder = this.repo.createQueryBuilder('category')
      .withDeleted() // <- Quan trọng: lấy cả dữ liệu đã bị soft delete
      .leftJoinAndSelect('category.products', 'products')
      .leftJoinAndSelect('category.grades', 'grades')
      .where('category.deletedAt IS NOT NULL'); // <- Lọc chỉ các bản ghi đã bị soft-delete
  
    const { page, limit, skip, order, search } = pageOptions;
    const paginationParams = ['page', 'limit', 'skip', 'order', 'search'];
  
    // Lọc theo các trường khác
    // if (query && Object.keys(query).length > 0) {
    //   Object.keys(query).forEach((key) => {
    //     if (!paginationParams.includes(key) && query[key] !== undefined) {
    //       queryBuilder.andWhere(`category.${key} = :${key}`, { [key]: query[key] });
    //     }
    //   });
    // }
  
    // Tìm kiếm theo tên
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(category.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }
  
    queryBuilder
      .orderBy('category.createdAt', order)
      .skip(skip)
      .take(limit);
  
    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    const { entities } = await queryBuilder.getRawAndEntities();
  
    return new PageDto(entities, pageMetaDto);
  }
  

}
