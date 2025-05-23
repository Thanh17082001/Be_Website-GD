import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { Grade } from 'src/grades/entities/grade.entity';
import { User } from 'src/users/entities/user.entity';
import { ItemDto, PageDto } from 'src/common/pagination/page.dto';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class) private repo: Repository<Class>,
    @InjectRepository(Grade) private repoGrade: Repository<Grade>,
  ) { }
  async create(createClassDto: CreateClassDto, user: User) {
    const { name, grade } = createClassDto;
    if (await this.repo.findOne({ where: { name } })) {
      throw new HttpException('Tên đã tồn tại', 409);
    }
    // Ép kiểu gradeId sang number (vì id trong DB thường là số)
    const parsedGradeId = Number(grade);
    if (isNaN(parsedGradeId)) {
      throw new HttpException('Khối không hợp lệ', 400);
    }
    const checkGrade: Grade = await this.repoGrade.findOne({ where: { id: parsedGradeId } });
    if (!checkGrade) {
      throw new HttpException('Khối không tồn tại', 409);
    }
    // console.log(grade)
    const newClass = {
      name,
      grade: checkGrade,
      createdBy: user?.isAdmin ? user : null,
    }
    // console.log(newClass)
    return await this.repo.save(newClass);
  }
  async findAll(
    pageOptions: PageOptionsDto,
    rawQuery: Record<string, any>, // 👈 để kiểm tra frontend có gửi limit hay không
    user: User
  ): Promise<PageDto<Class>> {
    const queryBuilder = this.repo
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.grade', 'grade')
      .leftJoinAndSelect('class.createdBy', 'createdBy')
      .leftJoinAndSelect('class.products', 'products')
      .leftJoinAndSelect('class.subjects', 'subjects');

    const { page, limit, skip, order, search } = pageOptions;
    const pagination: string[] = ['page', 'limit', 'skip', 'order', 'search'];

    // Filter theo query
    Object.keys(rawQuery).forEach((key) => {
      if (!pagination.includes(key)) {
        queryBuilder.andWhere(`class.${key} = :${key}`, { [key]: rawQuery[key] });
      }
    });

    // Search
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(class.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy('class.id', order);
    // 👇 Nếu frontend không truyền limit thì bỏ phân trang
    const hasLimit = Object.prototype.hasOwnProperty.call(rawQuery, 'limit');

    if (hasLimit) {
      queryBuilder.skip(skip).take(limit);
    }

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(entities, new PageMetaDto({ pageOptionsDto: pageOptions, itemCount }));
  }
  async findOne(id: number): Promise<ItemDto<Class>> {

    const example = await this.repo.findOne({ where: { id }, relations: ['grade', 'createdBy', 'subjects', 'products'] });
    if (!example) {
      throw new NotFoundException(` Không tìm thấy lớp với ID: ${id}`)
    }
    return new ItemDto(example);
  }
  async update(id: number, updateClassDto: UpdateClassDto) {
    const { name, grade } = updateClassDto;

    // Kiểm tra tên đã tồn tại chưa
    const exampleExits: Class = await this.repo.findOne({ where: { name, id: Not(id) } });
    if (exampleExits) {
      throw new HttpException('Tên đã tồn tại', 409);
    }

    // Kiểm tra sự tồn tại của Class
    const example: Class = await this.repo.findOne({ where: { id }, relations: ['grade'] });
    if (!example) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    // Kiểm tra sự tồn tại của grade (cấp)
    const parsedGradeId = Number(grade); // Ép kiểu gradeId sang number
    if (isNaN(parsedGradeId)) {
      throw new HttpException('Cấp không hợp lệ', 400);
    }

    const checkGrade: Grade = await this.repoGrade.findOne({ where: { id: parsedGradeId } });
    if (!checkGrade) {
      throw new HttpException('Cấp không tồn tại', 409);
    }

    // Cập nhật các trường trong đối tượng Class
    Object.assign(example, { name, grade: checkGrade }); // Thay gradeId bằng đối tượng grade

    // Cập nhật dữ liệu trong DB
    // console.log(example)
    await this.repo.save(example);

    return new ItemDto(example);
  }
  async remove(id: number): Promise<Class> {
    const isClass = await this.repo.findOne({ where: { id } });
    if (!isClass) {
      throw new NotFoundException(`Không tìm thấy lớp với ID: ${id}`);
    }
    await this.repo.softDelete(id); // Sử dụng soft delete
    return isClass; // Trả về dữ liệu trước khi xóa
  }
  async restore(id: number): Promise<Class> {
    const isClass = await this.repo.findOne({
      where: { id },
      withDeleted: true, // Cho phép tìm cả bản ghi đã bị soft delete
    });

    if (!isClass) {
      throw new NotFoundException(`Không tìm thấy lớp đã xóa với ID: ${id}`);
    }

    await this.repo.restore(id);
    return isClass;
  }
  async findByDeleted(
    pageOptions: PageOptionsDto,
    query: Partial<Class>,
    user: User
  ): Promise<PageDto<Class>> {
    const queryBuilder = this.repo
      .createQueryBuilder('class')
      .withDeleted()
      .leftJoinAndSelect('class.grade', 'grade')
      .leftJoinAndSelect('class.createdBy', 'createdBy')
      .leftJoinAndSelect('class.products', 'products') // 👈 Join sản phẩm
      .leftJoinAndSelect('class.subjects', 'subjects')
      .where('class.deletedAt IS NOT NULL');

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
}
