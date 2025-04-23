import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Grade } from 'src/grade/entities/grade.entity';
import { Subject } from './entities/subject.entity';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';
import { Product } from 'src/product/entities/product.entity';
import { Class } from 'src/class/entities/class.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject) private repo: Repository<Subject>,
    @InjectRepository(Grade) private repoGrade: Repository<Grade>,
    @InjectRepository(Product) private repoProduct: Repository<Product>,
    @InjectRepository(Class) private repoClass: Repository<Class>,
  ) { }
  async create(createSubjectDto: CreateSubjectDto, user: User): Promise<Subject> {
    const { name, gradeId, classes } = createSubjectDto;

    // Kiểm tra tên môn học đã tồn tại trong khối chưa
    const existing = await this.repo.findOne({
      where: {
        name,
        grade: { id: gradeId },
      },
      relations: ['grade'],
    });

    if (existing) {
      throw new HttpException('Tên môn học đã tồn tại trong khối này', 409);
    }

    // Tìm khối
    const grade = await this.repoGrade.findOne({ where: { id: gradeId } });
    if (!grade) {
      throw new HttpException('Khối không tồn tại', 404);
    }

    // // Kiểm tra danh sách sản phẩm liên kết
    // let products: Product[] = [];
    // if (Array.isArray(productIds) && productIds.length > 0) {
    //   products = await this.repoProduct.findBy({ id: In(productIds) });

    //   if (products.length !== productIds.length) {
    //     throw new HttpException('Một hoặc nhiều sản phẩm không tồn tại', 404);
    //   }
    // }

    // Kiểm tra danh sách class
    let newClasses: Class[] = [];
    if (Array.isArray(classes) && classes.length > 0) {
      newClasses = await this.repoClass.findBy({ id: In(classes) });

      if (newClasses.length !== classes.length) {
        throw new HttpException('Một hoặc nhiều lớp không tồn tại', 404);
      }
    }

    // Tạo subject mới
    const newSubject = this.repo.create({
      name,
      grade,
      // products,
      classes: newClasses,
      createdBy: user?.isAdmin ? user : null,
    });

    return await this.repo.save(newSubject);
  }


  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Subject>
  ): Promise<PageDto<Subject>> {
    const queryBuilder = this.repo.createQueryBuilder('subject')
      .leftJoinAndSelect('subject.grade', 'grade') // Join grade
      .leftJoinAndSelect('subject.createdBy', 'createdBy')
      .leftJoinAndSelect('subject.products', 'product')
      .leftJoinAndSelect('subject.classes', 'class')

    const { page, limit, skip, order, search } = pageOptions;
    const paginationParams = ['page', 'limit', 'skip', 'order', 'search'];

    // Áp dụng filter theo query (ví dụ gradeId, name, ...)
    if (query && Object.keys(query).length > 0) {
      Object.keys(query).forEach((key) => {
        if (!paginationParams.includes(key) && query[key] !== undefined) {
          queryBuilder.andWhere(`subject.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }

    // Search theo tên môn học
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(subject.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy('subject.createdAt', order)
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(entities, pageMetaDto);
  }


  async findOne(id: number): Promise<Subject> {
    const subject = await this.repo.findOne({
      where: { id },
      relations: ['grade', 'createdBy', 'products', 'classes'], // Thêm relations nếu cần
    });

    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID: ${id}`);
    }

    return subject;
  }


  async update(id: number, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    const { name, gradeId, classes } = updateSubjectDto;
    // console.log(name, gradeId, productIds, classes)
    const isDuplicate = await this.repo.findOne({
      where: {
        name,
        grade: { id: gradeId },
        id: Not(id),
      },
      relations: ['grade'],
    });

    if (isDuplicate) {
      throw new BadRequestException('Tên môn học đã tồn tại');
    }

    const existingSubject = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grade', 'products', 'classes'],
    });

    if (!existingSubject) {
      throw new BadRequestException('Không tìm thấy môn học này!');
    }

    // Nếu có gradeId mới được truyền vào, cần lấy entity Grade
    if (updateSubjectDto.gradeId) {
      const grade = await this.repoGrade.findOne({
        where: { id: updateSubjectDto.gradeId },
      });

      if (!grade) {
        throw new NotFoundException(`Không tìm thấy khối với ID: ${updateSubjectDto.gradeId}`);
      }

      // Gán lại entity Grade vào subject
      existingSubject.grade = grade;
    }
    // if (Array.isArray(productIds)) {
    //   const foundProducts = await this.repoProduct.findBy({ id: In(productIds) });
    //   if (foundProducts.length !== productIds.length) {
    //     throw new BadRequestException('Một hoặc nhiều sản phẩm không tồn tại');
    //   }
    //   existingSubject.products = foundProducts;
    // }

    if (Array.isArray(classes)) {
      const foundClasses = await this.repoClass.findBy({ id: In(classes) });
      if (foundClasses.length !== classes.length) {
        throw new BadRequestException('Một hoặc nhiều lớp không tồn tại');
      }
      existingSubject.classes = foundClasses;
    }
    // Merge lại các giá trị khác (name, ...)
    const merged = this.repo.merge(existingSubject, {
      ...updateSubjectDto,
      classes: undefined,
      // products: undefined,
    });

    return await this.repo.save(merged);
  }

  async remove(id: number): Promise<void> {
    const subject = await this.repo.findOne({ where: { id } });

    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID: ${id}`);
    }

    await this.repo.remove(subject); // Hard delete: xóa vĩnh viễn
  }

}
