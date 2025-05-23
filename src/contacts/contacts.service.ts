import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact) private repo: Repository<Contact>,
    @InjectRepository(User) private userrepo: Repository<User>,
  ) { }
  async create(createContactDto: CreateContactDto, user_cr: User) {
    const { name, phone, address, user, messages, email } = createContactDto
    // console.log(messages)
    // kiem tra dia chi cua user
    if(!user) {
      throw new HttpException('Không tìm thầy user ', 409)
    }
    const checkName = await this.repo.findOne({
      where: { name },
    })

    const checkUser = await this.userrepo.findOne({ where: { id: Number(user) } })
    if (!checkUser) {
      throw new HttpException(`Không tìm thầy user với ID: ${user}`, 409)
    }
    // const isUserLinked = await this.repo.findOne({ where: { user: { id: Number(user) } } });
    // if (isUserLinked) {
    //   throw new HttpException('User này đã có liên hệ (contact) rồi', 409);
    // }
    // if (checkName) {
    //   throw new HttpException('Tên liên hệ đã tồn tại', 409)
    // }
    // // Kiểm tra số điện thoại đã tồn tại
    // const checkPhone = await this.repo.findOne({ where: { phone } });
    // if (checkPhone) {
    //   throw new HttpException('Số điện thoại đã tồn tại', 409);
    // }
    const newContact = {
      name,
      phone,
      address,
      messages,
      email,
      user: { ...checkUser },
      createdBy: user_cr?.isAdmin ? user_cr : null,
    }
    // console.log(newContact)
    return await this.repo.save(newContact)
  }
  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<Contact>
  ): Promise<PageDto<Contact>> {
    const queryBuilder = this.repo.createQueryBuilder('contact')
      .leftJoinAndSelect('contact.user', 'user')
      .leftJoinAndSelect('contact.createdBy', 'createdBy'); // Join user liên quan

    const { page, limit, skip, order, search } = pageOptions;
    const paginationParams = ['page', 'limit', 'skip', 'order', 'search'];

    // Filter theo query (ví dụ: userId, phone, ...)
    if (query && Object.keys(query).length > 0) {
      Object.keys(query).forEach((key) => {
        if (!paginationParams.includes(key) && query[key] !== undefined) {
          queryBuilder.andWhere(`contact.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }

    // Search theo tên người liên hệ
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(contact.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy('contact.createdAt', order)
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(entities, pageMetaDto);
  }
  async findOne(contactId: number): Promise<Contact> {
    const contact = await this.repo.findOne({
      where: { id: contactId },
      relations: ['user', 'createdBy'],
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }
  async update(id: number, updateContactDto: UpdateContactDto, user: User): Promise<Contact> {
    // 1️⃣ Tìm contact theo id
    const contact = await this.repo.findOne({
      where: { id },
      relations: ['user', 'createdBy'], // Nếu cần thông tin user và createdBy
    });

    // 2️⃣ Kiểm tra nếu không tìm thấy contact
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // 3️⃣ Kiểm tra số điện thoại đã tồn tại (nếu cần)
    if (updateContactDto.phone) {
      const existingPhone = await this.repo.findOne({ where: { phone: updateContactDto.phone } });
      if (existingPhone && existingPhone.id !== id) {
        throw new HttpException('Số điện thoại đã tồn tại', 409);
      }
    }

    // 4️⃣ Cập nhật thông tin
    contact.name = updateContactDto.name || contact.name;
    contact.phone = updateContactDto.phone || contact.phone;
    contact.address = updateContactDto.address || contact.address;

    // 5️⃣ Cập nhật người tạo nếu cần (có thể dùng user từ JWT)
    contact.createdBy = user?.isAdmin ? user : contact.createdBy;

    // 6️⃣ Lưu lại contact đã được cập nhật
    return await this.repo.save(contact);
  }
  async remove(id: number, user: User): Promise<Contact> {
    const contact = await this.repo.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    await this.repo.softDelete({id});
    return contact;
  }
  async restore(id: number, user: User): Promise<Contact> {
    const contact = await this.repo.findOne({
      where: { id },
      withDeleted: true,
      relations: ['createdBy'],
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    await this.repo.restore({id});
    return contact;
  }

}