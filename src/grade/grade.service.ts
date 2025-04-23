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
      .leftJoinAndSelect('grade.products', 'products')
      .innerJoinAndSelect('grade.categories', 'categories');
    const { page, limit, skip, order, search } = pageOptions;
    const pagination: string[] = ['page', 'limit', 'skip', 'order', 'search']

    if (!!query && Object.keys(query).length > 0) {
      const arrayQuery: string[] = Object.keys(query);
      arrayQuery.forEach((key) => {
        if (key && !pagination.includes(key)) {
          queryBuilder.andWhere(`grade.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }

    //search document
    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(grade.name)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy(`grade.name`, 'ASC')
      .skip(skip)
      .limit(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    const { entities } = await queryBuilder.getRawAndEntities();


    return new PageDto(entities, pageMetaDto);
  }


  async findOne(id: number): Promise<ItemDto<Grade>> {

    const example = await this.repo.findOne({
      where: { id },
      relations: ['typeProducts', 'products', 'subjects', 'classes', 'categories'],
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


}
