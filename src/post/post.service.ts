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
    // console.log(createPostDto)
    const { name, title, content, image, description} = createPostDto
    const post = await this.repo.save({
      name: name,
      title: title,
      content: content,
      image: image,
      description: description,
      createdBy: user.isAdmin ? user : null
    })
    return post
  }

  async findAll(pageOptions: PageOptionsDto, query: Partial<User>): Promise<PageDto<Post>> {
      const queryBuilder = this.repo.createQueryBuilder('post').leftJoinAndSelect('post.createdBy', 'createdBy');
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
      
      // 💡 Map lại image path thành full URL
      const mappedEntities = entities.map((post) => {
        if (post.image && !post.image.startsWith('http')) {
          post.image = `${process.env.HOST_API_URL || 'http://localhost:3087/api'}/${post.image}`;
        }
        return post;
      });
      return new PageDto(entities, pageMetaDto);
    }
  
    async findOne(id: number): Promise<Post> {
      const post = await this.repo.findOne({
        where: { id },
        relations: ['createdBy'],
      });
    
      if (!post) {
        throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
      }
    
      if (post.image) {
        const hostUrl = 'http://localhost:3087/api'; // Có thể dùng biến ENV nếu cần
        post.image = `${hostUrl}/api/${post.image}`;
      }
    
      return post;
    }
    
    
  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const existingPost = await this.repo.findOne({
      where: { id },
      relations: ['createdBy'],
    });
  
    if (!existingPost) {
      throw new BadRequestException('Không tìm thấy tin tức này!');
    }
  
    // Merge update DTO vào bản ghi cũ
    const merged = this.repo.merge(existingPost, updatePostDto);
  
    // Lưu lại
    return await this.repo.save(merged);
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
