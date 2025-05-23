import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePricequoteDto } from './dto/create-pricequote.dto';
import { UpdatePricequoteDto } from './dto/update-pricequote.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pricequote } from './entities/pricequote.entity';
import { PricequoteDetail } from 'src/pricequote-details/entities/pricequote-detail.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PageDto } from 'src/common/pagination/page.dto';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';

@Injectable()
export class PricequotesService {
  constructor(
    @InjectRepository(Pricequote) private repo: Repository<Pricequote>,
    @InjectRepository(PricequoteDetail) private pricedetailRepo: Repository<PricequoteDetail>,
  ) { }
  async create(createPricequoteDto: CreatePricequoteDto, user: User) {
    const { fullName, phone, address, email, messages, details } = createPricequoteDto;

    // Tạo pricequote, chưa có details
    const pricequote = this.repo.create({
      fullName,
      phone,
      address,
      email,
      messages,
      createdBy: user,
    });

    // Lưu pricequote để có id
    const savedPricequote = await this.repo.save(pricequote);

    // Hàm copy ảnh
    const copyImage = (originalPath: string): string => {
      const filename = path.basename(originalPath);
      const newFilename = `${uuidv4()}_${filename}`;
      const sourcePath = path.resolve(originalPath);
      const targetDir = path.resolve('public/pricequote/image');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const targetPath = path.join(targetDir, newFilename);
      fs.copyFileSync(sourcePath, targetPath);
      return `public/pricequote/image/${newFilename}`;
    };

    // Tạo và lưu từng detail
    for (const detailDto of details) {
      // Copy từng ảnh trong detail.images
      const copiedImages = detailDto.images.map(imgPath => copyImage(imgPath));

      const detail = this.pricedetailRepo.create({
        ...detailDto,
        images: copiedImages,
        pricequote: savedPricequote,
      });

      await this.pricedetailRepo.save(detail);
    }

    // Nếu muốn lấy lại pricequote có details
    const result = await this.repo.findOne({
      where: { id: savedPricequote.id },
      relations: ['details'],
    });

    return result;
  }
  async findAll(pageOptions: PageOptionsDto, query: Partial<Pricequote>): Promise<PageDto<Pricequote>> {
    const queryBuilder = this.repo.createQueryBuilder('pricequote')
      .leftJoinAndSelect('pricequote.details', 'details')
      .leftJoinAndSelect('pricequote.createdBy', 'createdBy');

    const { page, limit, skip, order, search } = pageOptions;
    const paginationFields = ['page', 'limit', 'skip', 'order', 'search'];
    const validFields = [''];

    if (query && Object.keys(query).length > 0) {
      Object.keys(query).forEach(key => {
        if (key && !paginationFields.includes(key) && validFields.includes(key)) {
          queryBuilder.andWhere(`pricequote.${key} = :${key}`, { [key]: query[key] });
        }
      });
    }

    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(pricequote.fullName)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    queryBuilder
      .orderBy('pricequote.createdAt', order)
      .skip(skip)
      .take(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(entities, pageMetaDto);
  }
  async findOne(id: number) {
    const pricequote = await this.repo.findOne({
      where: { id },
      relations: ['details'],
    });

    if (!pricequote) {
      throw new NotFoundException(`Không tìm thấy báo giá với id: ${id}`);
    }

    return pricequote;
  }

  async update(id: number, updatePricequoteDto: UpdatePricequoteDto): Promise<Pricequote> {
    const pricequote = await this.repo.findOne({ where: { id } });

    if (!pricequote) {
      throw new NotFoundException(`Pricequote with id ${id} not found`);
    }

    if (updatePricequoteDto.fullName !== undefined) {
      pricequote.fullName = updatePricequoteDto.fullName;
    }
    if (updatePricequoteDto.phone !== undefined) {
      pricequote.phone = updatePricequoteDto.phone;
    }
    if (updatePricequoteDto.address !== undefined) {
      pricequote.address = updatePricequoteDto.address;
    }
    if (updatePricequoteDto.email !== undefined) {
      pricequote.email = updatePricequoteDto.email;
    }
    if (updatePricequoteDto.messages !== undefined) {
      pricequote.messages = updatePricequoteDto.messages;
    }
    if (updatePricequoteDto.status !== undefined) {
      pricequote.status = updatePricequoteDto.status;
    }

    return await this.repo.save(pricequote);
  }

  async remove(id: number): Promise<Pricequote> {
    const pricequote = await this.repo.findOne({ where: { id } });

    if (!pricequote) {
      throw new NotFoundException(`Không tìm thấy bản báo giá với ID: ${id}`);
    }

    await this.repo.softDelete(id); // ✅ cập nhật deletedAt
    return pricequote; // Trả về bản ghi đã bị đánh dấu xóa
  }
  async restore(id: number): Promise<Pricequote> {
    const pricequote = await this.repo.findOne({ where: { id }, withDeleted: true });

    if (!pricequote) {
      throw new NotFoundException(`Không tìm thấy bản báo giá với ID: ${id}`);
    }

    await this.repo.restore(id); // Xóa giá trị deletedAt => khôi phục bản gh
    return pricequote; // Trả về bản ghi đã bị đánh dấu xóa
  }
}
