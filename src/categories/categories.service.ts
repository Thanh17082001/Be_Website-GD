import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { In, Not, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Product } from 'src/product/entities/product.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';
import { Grade } from 'src/grade/entities/grade.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
    @InjectRepository(Product) private repoProduct: Repository<Product>,
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>,
  ) { }
  async create(createCategoryDto: CreateCategoryDto, user: User): Promise<Category> {
    const { name, products, grades } = createCategoryDto;

    const checkName = await this.repo.findOne({ where: { name } })
    if (checkName) {
      throw new HttpException('Tên danh mục đã tồn tại', 409)
    }

    // Kiểm tra danh sách sản phẩm liên kết
    let newProducts: Product[] = [];
    if (Array.isArray(products) && products.length > 0) {
      newProducts = await this.repoProduct.findBy({ id: In(products) });

      if (newProducts.length !== products.length) {
        throw new HttpException('Một hoặc nhiều sản phẩm không tồn tại', 404);
      }
    }
    // Kiểm tra danh sách cấp học liên kết (grades)
    let newGrades: Grade[] = [];
    if (Array.isArray(grades) && grades.length > 0) {
      newGrades = await this.gradeRepo.findBy({ id: In(grades) });

      if (newGrades.length !== grades.length) {
        throw new HttpException('Một hoặc nhiều cấp học không tồn tại', 404);
      }
    }
    const newCategory = {
      name,
      products: newProducts,
      grades: newGrades
    }

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
    if (query && Object.keys(query).length > 0) {
      Object.keys(query).forEach((key) => {
        if (!paginationParams.includes(key) && query[key] !== undefined) {
          queryBuilder.andWhere(`category.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }

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

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    // console.log(id)
    const { name, products, grades } = updateCategoryDto

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

    // Nếu có productIds, cập nhật lại danh sách products
    if (products && Array.isArray(products)) {
      const newProducts = await this.repoProduct.find({
        where: { id: In(products) },
      });

      if (newProducts.length !== products.length) {
        throw new NotFoundException('Một hoặc nhiều sản phẩm không tồn tại');
      }

      existingCategory.products = newProducts;
    }
    if (grades && Array.isArray(grades)) {
      const newGrades = await this.gradeRepo.find({
        where: { id: In(grades) },
      });

      if (newGrades.length !== grades.length) {
        throw new NotFoundException('Một hoặc nhiều cấp học không tồn tại');
      }

      existingCategory.grades = newGrades;
    }

    return await this.repo.save(existingCategory);

  }

  async remove(id: number): Promise<void> {
    const category = await this.repo.findOne({
      where: { id },
      relations: ['products'], // Load luôn để tránh lỗi nếu có ràng buộc
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục này!');
    }

    await this.repo.remove(category);
  }

}
