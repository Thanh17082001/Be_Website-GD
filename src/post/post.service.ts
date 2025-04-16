import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { User } from 'src/users/entities/user.entity';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';
import { PageDto } from 'src/common/pagination/page.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private repo: Repository<Post>
  ){}
  async create(createPostDto: CreatePostDto, user: User): Promise<Post> {
    const { title, content} = createPostDto
    const post = await this.repo.save({
      title: title,
      content: content,
      createdBy: user.isAdmin ? null : user
    })
    return post
  }

  async findAll(pageOptions: PageOptionsDto, query: Partial<User>): Promise<PageDto<Post>> {
      const queryBuilder = this.repo.createQueryBuilder('post');
      const { page, limit, skip, order, search } = pageOptions;
      const pagination: string[] = ['page', 'limit', 'skip', 'order', 'search']
      if (!!query && Object.keys(query).length > 0) {
        const arrayQuery: string[] = Object.keys(query);
        arrayQuery.forEach((key) => {
          if (key && !pagination.includes(key)) {
            queryBuilder.andWhere(`post.${key} = :${key}`, { [key]: query[key] });
          }
        });
      }
  
      //search document
      if (search) {
        queryBuilder.andWhere(`LOWER(unaccent(post.title)) ILIKE LOWER(unaccent(:search))`, {
          search: `%${search}%`,
        });
      }
  
  
      queryBuilder.orderBy(`post.createdAt`, order)
        .skip(skip)
        .take(limit);
  
      const itemCount = await queryBuilder.getCount();
      const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
      const { entities } = await queryBuilder.getRawAndEntities();
  
      return new PageDto(entities, pageMetaDto);
    }
  
  async findOne(id: number): Promise<Post> {
    const post = await this.repo.findOne({where: {id}})
    if(!post) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`)
    }
    return post
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const isPost = await this.repo.findOne({where: {id}})

    if(!isPost) {
      throw new BadRequestException('Không tìm thấy tin tức này!')
    }
    console.log(updatePostDto)
    await this.repo.update(id, updatePostDto)
    return this.repo.findOne({where: {id}})
  }

  async remove(id: number): Promise<Post> {
    const post = await this.repo.findOne({where: {id}})
    if(!post) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`)
    }
    this.repo.delete({id})
    return post
  }
}
