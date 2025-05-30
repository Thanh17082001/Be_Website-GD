import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Grade } from 'src/grades/entities/grade.entity';
import { Subject } from './entities/subject.entity';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';
import { Product } from 'src/products/entities/product.entity';
import { Class } from 'src/classes/entities/class.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject) private repo: Repository<Subject>,
    @InjectRepository(Grade) private repoGrade: Repository<Grade>,
    @InjectRepository(Product) private repoProduct: Repository<Product>,
    @InjectRepository(Class) private repoClass: Repository<Class>,
  ) { }
  async create(createSubjectDto: CreateSubjectDto, user: User) {
    const { name, grades, classes } = createSubjectDto;

    // Chuyển grades và classes thành mảng số
    const gradeIds = grades.map(grade => parseInt(grade));
    const classIds = classes.map(classId => parseInt(classId));

    // Kiểm tra tên môn học đã tồn tại trong khối chưa
    const existing = await this.repo.findOne({
      where: {
        name,
        grades: { id: In(gradeIds) }, // Kiểm tra với mảng gradeIds
      },
      relations: ['grades'],
    });

    if (existing) {
      throw new HttpException('Tên môn học đã tồn tại trong khối này', 409);
    }

    // Tìm khối
    const gradesData = await this.repoGrade.find({
      where: { id: In(gradeIds) },  // Tìm theo mảng gradeIds
    });

    if (gradesData.length !== gradeIds.length) {
      throw new HttpException('Một hoặc nhiều khối không tồn tại', 404);
    }

    // Kiểm tra danh sách lớp
    let newClasses: Class[] = [];
    if (classIds.length > 0) {
      newClasses = await this.repoClass.findBy({ id: In(classIds) });

      if (newClasses.length !== classIds.length) {
        throw new HttpException('Một hoặc nhiều lớp không tồn tại', 404);
      }
    }

    // Tạo subject mới
    const newSubject = this.repo.create({
      name,
      grades: gradesData,  // Lưu mảng gradesData
      classes: newClasses,
      createdBy: user?.isAdmin ? user : null,
    });
    // console.log(newSubject)
    return await this.repo.save(newSubject);
  }
  async findAll(
    pageOptions: PageOptionsDto,
    rawQuery: Record<string, any>,
    user: User
  ): Promise<PageDto<Subject>> {
    const queryBuilder = this.repo.createQueryBuilder('subject')
      .leftJoinAndSelect('subject.createdBy', 'createdBy')
      .leftJoinAndSelect('subject.products', 'product')
      .leftJoinAndSelect('subject.classes', 'class')
      .leftJoinAndSelect('subject.grades', 'grades');

    const { page, limit, skip, order, search } = pageOptions;
    const paginationParams = ['page', 'limit', 'skip', 'order', 'search'];

    // Filter theo query (loại bỏ các param phân trang)
    Object.keys(rawQuery).forEach(key => {
      if (!paginationParams.includes(key) && rawQuery[key] !== undefined) {
        queryBuilder.andWhere(`subject.${key} = :${key}`, { [key]: rawQuery[key] });
      }
    });

    // Search theo tên môn học
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(subject.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }

    // Nếu không truyền limit thì bỏ phân trang (get all)
    const hasLimit = Object.prototype.hasOwnProperty.call(rawQuery, 'limit');
    if (hasLimit) {
      queryBuilder.skip(skip).take(limit);
    }

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(entities, new PageMetaDto({ pageOptionsDto: pageOptions, itemCount }));
  }
  async findOne(id: number): Promise<Subject> {
    const subject = await this.repo.findOne({
      where: { id },
      relations: ['grades', 'createdBy', 'products', 'classes'], // Thêm relations nếu cần
    });

    if (!subject) {
      throw new NotFoundException(`Không tìm thấy môn học với ID: ${id}`);
    }

    return subject;
  }
  async update(id: number, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    const { name, grades, classes } = updateSubjectDto;

    // Kiểm tra trùng tên môn học với môn học khác (không trùng với id hiện tại)
    const isDuplicate = await this.repo.findOne({
      where: {
        name,
        grades: { id: In(grades) },  // Kiểm tra trùng với danh sách grades
        id: Not(id),  // Không trùng với id hiện tại
      },
      relations: ['grades'],
    });

    if (isDuplicate) {
      throw new BadRequestException('Tên môn học đã tồn tại trong khối này');
    }

    // Tìm môn học hiện tại
    const existingSubject = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grades', 'products', 'classes'],
    });

    if (!existingSubject) {
      throw new BadRequestException('Không tìm thấy môn học này!');
    }

    // Cập nhật Grade nếu có thay đổi
    if (grades && grades.length > 0) {
      const gradeIds = grades.map(grade => parseInt(grade));  // Chuyển grade từ chuỗi thành số
      const foundGrades = await this.repoGrade.find({
        where: { id: In(gradeIds) },  // Tìm theo mảng grades
      });

      if (foundGrades.length !== gradeIds.length) {
        throw new NotFoundException('Một hoặc nhiều khối không tồn tại');
      }

      existingSubject.grades = foundGrades;  // Cập nhật lại grades với đối tượng Grade
    }

    // Cập nhật Classes nếu có thay đổi
    if (classes && classes.length > 0) {
      const classIds = classes.map(classId => parseInt(classId));  // Chuyển classId từ chuỗi thành số
      const foundClasses = await this.repoClass.find({
        where: { id: In(classIds) },
      });

      if (foundClasses.length !== classIds.length) {
        throw new BadRequestException('Một hoặc nhiều lớp không tồn tại');
      }

      existingSubject.classes = foundClasses;  // Cập nhật lại classes với đối tượng Class
    }

    // Merge các giá trị khác vào môn học hiện tại
    const merged = this.repo.merge(existingSubject, {
      name,  // Cập nhật tên môn học
      ...updateSubjectDto,  // Cập nhật các trường khác
      classes: undefined,  // Đảm bảo không trùng lặp khi merge
      grades: undefined,  // Đảm bảo không trùng lặp khi merge
    });

    // Lưu và trả về môn học đã được cập nhật
    return await this.repo.save(merged);
  }
  async remove(id: number): Promise<Subject> {
    const subject = await this.repo.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!subject) {
      throw new NotFoundException('Subject không tồn tại');
    }

    await this.repo.softDelete({ id });
    return subject;
  }
  async restore(id: number): Promise<Subject> {
    const subject = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!subject) {
      throw new NotFoundException('Subject không tồn tại hoặc đã bị xoá');
    }

    await this.repo.restore(id);
    return this.repo.findOne({ where: { id } });
  }
  async findByClassesAndGrades(
    classIds: number[],
    gradeIds: number[],
  ): Promise<Subject[]> {
    const classQuery = this.repo.createQueryBuilder('subject')
      .leftJoin('subject.classes', 'class')
      .where('class.id IN (:...classIds)', { classIds })
      .groupBy('subject.id')
      .having('COUNT(DISTINCT class.id) = :classCount', { classCount: classIds.length });

    const gradeQuery = this.repo.createQueryBuilder('subject')
      .leftJoin('subject.grades', 'grade')
      .where('grade.id IN (:...gradeIds)', { gradeIds })
      .groupBy('subject.id')
      .having('COUNT(DISTINCT grade.id) = :gradeCount', { gradeCount: gradeIds.length });

    const classSubjects = await classQuery.select('subject.id').getRawMany();
    const gradeSubjects = await gradeQuery.select('subject.id').getRawMany();

    const classSubjectIds = classSubjects.map(s => s.subject_id);
    const gradeSubjectIds = gradeSubjects.map(s => s.subject_id);

    const intersectionIds = classSubjectIds.filter(id => gradeSubjectIds.includes(id));

    if (intersectionIds.length === 0) return [];

    // Lấy đầy đủ quan hệ
    return this.repo.createQueryBuilder('subject')
      // .leftJoinAndSelect('subject.classes', 'class')
      // .leftJoinAndSelect('subject.grades', 'grade')
      // .leftJoinAndSelect('subject.products', 'product')
      // .leftJoinAndSelect('subject.createdBy', 'createdBy')
      .whereInIds(intersectionIds)
      .orderBy('subject.id', 'ASC')
      .getMany();
  }
}
