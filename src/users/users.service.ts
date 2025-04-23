import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserUtil } from 'src/common/bryct/config.bryct';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';
import { ChangePassDto } from './dto/change-pass-dto';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>
  ){}
  async create(createUserDto: CreateUserDto) {
    const { fullName, username, password, email, role='khách hàng', isAdmin } = createUserDto

    const existUser : any = await this.repo.findOne({where: {email}})
    if(existUser) {
      throw new BadRequestException('Tên tài khoản đã tồn tại!')
    }

    const user = await this.repo.save({
      fullName: fullName,
      email: email,
      username: username,
      password: UserUtil.hashPassword(password),
      role,
      isAdmin: isAdmin ?? false

    })
    return user
  }
  async changePassword(dto: ChangePassDto, user: User): Promise<User> {
    const { password, newPassword } = dto;

    // 1️⃣ Tìm user theo `userId`
    const checkUser = await this.repo.findOne({ where: { id: user.id } });
    if (!checkUser) {
      throw new NotFoundException('User not found');
    }

    // 2️⃣ Kiểm tra mật khẩu cũ
    const isMatch = await UserUtil.comparePassword(password, checkUser.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    // 3️⃣ Mã hóa mật khẩu mới
    const hashedPassword = await UserUtil.hashPassword(newPassword);

    // 4️⃣ Lưu mật khẩu mới vào database
    user.password = hashedPassword;
    const newUser = await this.repo.save(user);

    return newUser;
  }
  async findAll(pageOptions: PageOptionsDto, query: Partial<User>): Promise<PageDto<User>> {
    const queryBuilder = this.repo.createQueryBuilder('user');
    const { page, limit, skip, order, search } = pageOptions;
    const pagination: string[] = ['page', 'limit', 'skip', 'order', 'search']
    if (!!query && Object.keys(query).length > 0) {
      const arrayQuery: string[] = Object.keys(query);
      arrayQuery.forEach((key) => {
        if (key && !pagination.includes(key)) {
          queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }

    //search document
    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(user.name)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }


    queryBuilder.orderBy(`user.createdAt`, order)
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(entities, pageMetaDto);
  }



  async findOne(id: number): Promise<User> {
    const user = await this.repo.findOne({where: {id}})

    if(!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`)
    }

    return user
  }

 async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
   const user = await this.repo.findOne({where: {id}})

   if(!user) {
    throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`)
   }

   if(updateUserDto.email) {
    const checking = await this.repo.findOne({where: {email: updateUserDto.email}})

    if(checking && checking.id !== id) {
      throw new BadRequestException('Username đã tồn tại cho người dùng khác!')
    }
   }
   await this.repo.update(id, updateUserDto)
   return this.repo.findOne({where: {id}})

  }

  async remove(id: number): Promise<User> {
    const user = await this.repo.findOne({where: {id}})

    if(!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`)
    }
    this.repo.delete({id})
    return user
  }
}
