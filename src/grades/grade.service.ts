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

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(Grade) private repo: Repository<Grade>
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

    const { page, limit, skip, order, search } = pageOptions;
    const pagination: string[] = ['page', 'limit', 'skip', 'order', 'search'];

    if (!!query && Object.keys(query).length > 0) {
      const arrayQuery: string[] = Object.keys(query);
      arrayQuery.forEach((key) => {
        if (key && !pagination.includes(key)) {
          queryBuilder.andWhere(`grade.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }

    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(grade.name)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy(`grade.name`, 'ASC')
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    const items = await queryBuilder.getMany();

    // Load full relations giống findOne
    const fullItems = await Promise.all(items.map(async (grade) => {
      const fullGrade = await this.repo.findOne({
        where: { id: grade.id },
        relations: [
          'typeParents',
          'typeProducts',
          // 'typeProducts.createdBy',
          'typeProducts.grades',
          'products',
          'products.createdBy',
          // 'products.grades',
          // 'products.classes',
          // 'products.typeProduct',
          // 'products.categories',
          // 'products.subjects',
          'subjects',
          // 'subjects.createdBy',
          'subjects.grades',
          // 'subjects.products',
          'subjects.classes',
          'classes',
          // 'classes.createdBy',
          'classes.grade',
          'classes.subjects',
          // 'classes.products',
          'categories',
          // 'categories.createdBy',
          // 'categories.products',
          'categories.grades',
        ],
      });
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

    return new ItemDto(example);;
  }
  async filterByTypeParentAndGrade(
    pageOptions: PageOptionsDto,
    typeParentId: number,
    gradeId: number,
  ): Promise<PageDto<Grade>> {
    const queryBuilder = this.repo.createQueryBuilder('grade')
      .leftJoinAndSelect('grade.typeProducts', 'typeProducts')
      .leftJoinAndSelect('grade.subjects', 'subjects')
      .leftJoinAndSelect('grade.classes', 'classes')
      .leftJoinAndSelect('grade.categories', 'categories')
      .leftJoinAndSelect('grade.typeParents', 'typeParents');

    const { skip, limit, order, search } = pageOptions;

    // Lọc theo typeParentId và gradeId
    queryBuilder.where('grade.id = :gradeId', { gradeId });
    queryBuilder.andWhere('typeParents.id = :typeParentId', { typeParentId }); 

    queryBuilder.orderBy('grade.name', order).skip(skip).take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    const items = await queryBuilder.getMany();

    // Load full relations
    const fullItems = await Promise.all(items.map(async (grade) => {
      const fullGrade = await this.repo.findOne({
        where: { id: grade.id },
        relations: [
          'typeProducts',
          'typeParents',
          'products',
          'subjects',
          'classes',
          'categories',
        ],
      });
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
  
    await this.repo.softDelete({id});
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
