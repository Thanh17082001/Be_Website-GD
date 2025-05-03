import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTypeParentDto } from './dto/create-type-parent.dto';
import { UpdateTypeParentDto } from './dto/update-type-parent.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeParent } from './entities/type-parent.entity';
import { In, Not, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Grade } from 'src/grades/entities/grade.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';

@Injectable()
export class TypeParentsService {
  constructor(
    @InjectRepository(TypeParent) private repo: Repository<TypeParent>,
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>,
  ) { }
  async create(createTypeParentDto: CreateTypeParentDto, user: User) {
    let { name, grades } = createTypeParentDto

    // Parse grades nếu là string
    if (typeof grades === 'string') {
      try {
        grades = JSON.parse(grades); // '[2]' -> [2]
      } catch (e) {
        throw new HttpException('Định dạng grades không hợp lệ', 400);
      }
    }
    // Kiểm tra trùng tên
    const isTypeProduct = await this.repo.findOne({ where: { name } });
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

    const newTypeParent = this.repo.create({
      name,
      grades: newGrades,
      createdBy: user.isAdmin ? user : null,
    });
    // console.log(newTypeParent)
    return await this.repo.save(newTypeParent);
  }
  async findAll(pageOptions: PageOptionsDto, query: Partial<TypeParent>): Promise<PageDto<TypeParent>> {
    const queryBuilder = this.repo.createQueryBuilder('typeparent')
      .leftJoinAndSelect('typeparent.createdBy', 'createdBy')
      .leftJoinAndSelect('typeparent.grades', 'grades')  // Lấy thông tin grades
      .leftJoinAndSelect('typeparent.typeProducts', 'typeProducts')  // Lấy thông tin typeProducts nếu cần
      .leftJoinAndSelect('typeparent.products', 'products');  // Lấy thông tin products nếu cần

    const { page, limit, skip, order, search } = pageOptions;
    const paginationKeys = ['page', 'limit', 'skip', 'order', 'search'];

    // Lọc các điều kiện query
    if (query && Object.keys(query).length > 0) {
      const arrayQuery = Object.keys(query);
      arrayQuery.forEach((key) => {
        if (key && !paginationKeys.includes(key)) {
          queryBuilder.andWhere(`typeparent.${key} = :${key}`, {
            [key]: query[key],
          });
        }
      });
    }

    // Tìm kiếm theo tên (hoặc bất kỳ thuộc tính nào khác của TypeParent)
    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(typeparent.name)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    // Sắp xếp, phân trang
    queryBuilder
      .orderBy(`typeparent.createdAt`, order)
      .skip(skip)
      .take(limit);

    // Tính số lượng item
    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });

    // Lấy các entities
    const entities = await queryBuilder.getMany();

    return new PageDto(entities, pageMetaDto);
  }
  async findOne(id: number): Promise<TypeParent> {
    const typeParent = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grades', 'products', 'typeProducts'],  // Lấy thông tin createdBy và grades
    });

    if (!typeParent) {
      throw new NotFoundException(`Không tìm thấy loại (Type-Parents) với ID: ${id}`);
    }

    return typeParent;
  }
  async update(
    id: number,
    updateTypeParentDto: UpdateTypeParentDto
  ): Promise<TypeParent> {
    const { name, grades } = updateTypeParentDto;

    // Tìm TypeParent theo ID
    const typeParent = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grades'],  // Lấy thông tin createdBy và grades
    });

    if (!typeParent) {
      throw new NotFoundException(`Không tìm thấy loại (Type-Parents) với ID: ${id}`);
    }

    // Kiểm tra nếu tên đã tồn tại (trừ bản ghi hiện tại)
    const existingByName = await this.repo.findOne({
      where: { name, id: Not(id) },
    });

    if (existingByName) {
      throw new HttpException('Tên đã tồn tại', 409);
    }

    // Xử lý grades nếu có
    if (grades !== undefined) {
      let gradeIds: number[] = [];
      if (typeof grades === 'string') {
        try {
          gradeIds = JSON.parse(grades).map(id => parseInt(id, 10));
        } catch (e) {
          throw new BadRequestException('Danh sách grades không hợp lệ');
        }
      } else if (Array.isArray(grades)) {
        gradeIds = grades.map(id => parseInt(id, 10));
      } else {
        throw new BadRequestException('Danh sách grades không hợp lệ');
      }

      if (gradeIds.length === 0) {
        throw new BadRequestException('Danh sách grades không hợp lệ');
      }

      // Kiểm tra xem tất cả các grades có tồn tại trong cơ sở dữ liệu không
      const gradeEntities = await this.gradeRepo.find({ where: { id: In(gradeIds) } });
      if (gradeEntities.length !== gradeIds.length) {
        throw new NotFoundException('Một hoặc nhiều grade không tồn tại');
      }

      // Cập nhật lại grades cho TypeParent
      typeParent.grades = gradeEntities;
    }

    // Gộp các trường khác từ DTO vào entity TypeParent
    const { grades: _, ...restDto } = updateTypeParentDto;  // Loại bỏ trường grades khỏi DTO
    const merged = this.repo.merge(typeParent, restDto);

    // Lưu lại đối tượng TypeParent đã được cập nhật
    return this.repo.save(merged);
  }
  async remove(id: number): Promise<void> {
    // Tìm TypeParent theo ID
    const typeParent = await this.repo.findOne({
      where: { id },
      relations: ['grades'],  // Nếu cần, có thể lấy thêm các quan hệ khác như grades
    });

    if (!typeParent) {
      throw new NotFoundException(`Không tìm thấy loại (Type-Parents) với ID: ${id}`);
    }

    // Xóa đối tượng TypeParent
    await this.repo.remove(typeParent);
  }
}