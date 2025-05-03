import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { UpdateSolutionDto } from './dto/update-solution.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Solution } from './entities/solution.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';

@Injectable()
export class SolutionsService {
  constructor(
    @InjectRepository(Solution) private repo: Repository<Solution>
  ){}
  async create(createSolutionDto: CreateSolutionDto, user: User): Promise<Solution> {
    const { title, content } = createSolutionDto

    const solution = await this.repo.save({
      title: title,
      content: content,
      createdBy: user.isAdmin ? user : null
    })
    return solution
  }

  async findAll(pageOptions: PageOptionsDto, query: Partial<Solution>): Promise<PageDto<Solution>> {
    const queryBuilder = this.repo.createQueryBuilder('solution')
      .leftJoinAndSelect('solution.createdBy', 'createdBy');
  
    const { page, limit, skip, order, search } = pageOptions;
    const paginationKeys = ['page', 'limit', 'skip', 'order', 'search'];
  
    if (query && Object.keys(query).length > 0) {
      const filterKeys = Object.keys(query).filter(key => !paginationKeys.includes(key));
      filterKeys.forEach(key => {
        queryBuilder.andWhere(`solution.${key} = :${key}`, { [key]: query[key] });
      });
    }
  
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(solution.title)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }
  
    queryBuilder.orderBy('solution.createdAt', order)
      .skip(skip)
      .take(limit);
  
    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
  
    return new PageDto(entities, pageMetaDto);
  }  
  async findOne(id: number): Promise<Solution> {
    const solution = await this.repo.findOne({
      where: { id },
      relations: ['createdBy'],
    });
  
    if (!solution) {
      throw new NotFoundException(`Không tìm thấy giải pháp với ID: ${id}`);
    }
  
    return solution;
  }

  async update(id: number, updateSolutionDto: UpdateSolutionDto): Promise<Solution> {
    const solution = await this.repo.findOne({ where: { id } });
  
    if (!solution) {
      throw new NotFoundException(`Không tìm thấy solution với ID: ${id}`);
    }
  
    const updated = this.repo.merge(solution, updateSolutionDto);
    return this.repo.save(updated);
  }
  

  async remove(id: number): Promise<{ message: string }> {
    const solution = await this.repo.findOne({ where: { id } });
  
    if (!solution) {
      throw new NotFoundException(`Không tìm thấy solution với ID: ${id}`);
    }
  
    await this.repo.remove(solution);
  
    return { message: `Đã xóa solution với ID: ${id}` };
  }
  
}
