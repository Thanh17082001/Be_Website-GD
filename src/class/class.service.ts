import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { Grade } from 'src/grade/entities/grade.entity';
import { User } from 'src/users/entities/user.entity';
import { ItemDto, PageDto } from 'src/common/pagination/page.dto';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class) private repo: Repository<Class>,
    @InjectRepository(Grade) private repoGrade: Repository<Grade>,
  ){}
  async create(createClassDto: CreateClassDto, user: User){
    const { name, gradeId } = createClassDto;
    if (await this.repo.findOne({ where: { name } })) {
      throw new HttpException('Tên đã tồn tại', 409);
    }
    const grade: Grade = await this.repoGrade.findOne({ where: { id: gradeId } });
    if (!grade) {
      throw new HttpException('Khối không tồn tại', 409);
    }
    console.log(grade)
    const newClass = this.repo.create({ ...createClassDto, name: name, grade, createdBy: user.isAdmin ? user : null });
    return await this.repo.save(newClass);
  }

  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Class>,
    user: User
  ): Promise<PageDto<Class>> {
    const queryBuilder = this.repo
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.grade', 'grade')
      .leftJoinAndSelect('class.createdBy', 'createdBy');

      const { page, limit, skip, order, search } = pageOptions;
      const pagination: string[] = ['page', 'limit', 'skip', 'order', 'search'];

      // 🎯 Lọc theo các điều kiện cụ thể (trừ tham số phân trang)
    if (query && Object.keys(query).length > 0) {
      Object.keys(query).forEach((key) => {
        if (key && !pagination.includes(key)) {
          queryBuilder.andWhere(`class.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }

    // 🔎 Tìm kiếm theo tên lớp học (không phân biệt dấu và chữ hoa/thường)
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(class.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }

    // 📄 Phân trang và sắp xếp
    queryBuilder
      .orderBy('class.createdAt', order)
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(entities, new PageMetaDto({ pageOptionsDto: pageOptions, itemCount }));

  }

  async findOne(id: number): Promise<ItemDto<Class>> {

    const example = await this.repo.findOne({ where: { id }, relations: ['grade', 'createdBy'] });
    if (!example) {
      throw new HttpException('Not found', 404);
    }
    return new ItemDto(example);
  }

  async update(id: number, updateClassDto: UpdateClassDto) {
    const { name,gradeId } = updateClassDto;
    const exampleExits: Class = await this.repo.findOne({ where: { name, id: Not(id) } });
    if (exampleExits) {
      throw new HttpException('Tên đã tồn tại', 409);
    }

    const example: Class = await this.repo.findOne({ where: { id } });
    if (!example) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    const grade: Grade = await this.repoGrade.findOne({ where: { id: gradeId } });
    if (!grade) {
      throw new HttpException('Lớp không tồn tại', 409);
    }

    Object.assign(example, { name, grade })

    await this.repo.update(id, example)

    return new ItemDto(example);;
  }

  async remove(id: number) {
    const example = this.repo.findOne({ where: { id } });
    if (!example) {
      throw new NotFoundException('Không tìm thấy tài nguyên');
    }
    await this.repo.delete(id);
    return new ItemDto(await this.repo.delete(id));
  }
}
