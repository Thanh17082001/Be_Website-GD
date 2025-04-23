import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTypeProductDto } from './dto/create-type-product.dto';
import { UpdateTypeProductDto } from './dto/update-type-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { TypeProduct } from './entities/type-product.entity';
import { PageOptionsDto } from 'src/common/pagination/page-option-dto';
import { ItemDto, PageDto } from 'src/common/pagination/page.dto';
import { PageMetaDto } from 'src/common/pagination/page.metadata.dto';
import { User } from 'src/users/entities/user.entity';
import { Grade } from 'src/grade/entities/grade.entity';

@Injectable()
export class TypeProductsService {
  constructor(
    @InjectRepository(TypeProduct) private repo: Repository<TypeProduct>,
    @InjectRepository(Grade) private gradeRepo: Repository<Grade>
  ) { }
  async create(createTypeProductDto: CreateTypeProductDto, user: User): Promise<TypeProduct> {
    const { name, image, grades } = createTypeProductDto
    // console.log(name, grades)
    const isTypeProduct = await this.repo.findOne({ where: { name } })
    if (isTypeProduct) {
      throw new HttpException('Tên đã tồn tại', 409)
    }

    const newGrades = await this.gradeRepo.find({
      where: { id: In(grades) }
    })
    if (newGrades.length !== grades.length) {
      throw new HttpException('Một hoặc nhiều cấp học không tồn tại', 409)
    }

    const newTypeProduct = this.repo.create({
      name,
      image,
      grades: newGrades,
      createdBy: user.isAdmin ? user : null,
    });
    return await this.repo.save(newTypeProduct)
  }

  async findAll(
    pageOptions: PageOptionsDto,
    query: Partial<TypeProduct>,
  ): Promise<PageDto<TypeProduct>> {
    const queryBuilder = this.repo.createQueryBuilder('typeproduct')
      .leftJoinAndSelect('typeproduct.createdBy', 'createdBy')
      .leftJoinAndSelect('typeproduct.grades', 'grades')
    const { page, limit, skip, order, search } = pageOptions;

    const paginationKeys = ['page', 'limit', 'skip', 'order', 'search'];

    // Filter các điều kiện query
    if (!!query && Object.keys(query).length > 0) {
      const arrayQuery = Object.keys(query);
      arrayQuery.forEach((key) => {
        if (key && !paginationKeys.includes(key)) {
          queryBuilder.andWhere(`typeproduct.${key} = :${key}`, {
            [key]: query[key],
          });
        }
      });
    }

    // Tìm kiếm theo tên
    if (search) {
      queryBuilder.andWhere(`LOWER(unaccent(typeproduct.name)) ILIKE LOWER(unaccent(:search))`, {
        search: `%${search}%`,
      });
    }

    // Sắp xếp, phân trang
    queryBuilder
      .orderBy(`typeproduct.createdAt`, order)
      .skip(skip)
      .limit(limit);

    const itemCount = await queryBuilder.getCount();
    const pageMetaDto = new PageMetaDto({ pageOptionsDto: pageOptions, itemCount });
    const { entities } = await queryBuilder.getRawAndEntities();

    // 🛠️ Map đường dẫn đầy đủ cho image
    const host = process.env.HOST_API_URL || 'http://localhost:3087/api';
    const mappedEntities = entities.map((typeproduct) => {
      if (typeproduct.image && !typeproduct.image.startsWith('http')) {
        typeproduct.image = `${host}/${typeproduct.image}`;
      }
      return typeproduct;
    });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: number): Promise<TypeProduct> {
    const typeProduct = await this.repo.findOne({
      where: { id },
      relations: ['createdBy', 'grades'],
    });

    if (!typeProduct) {
      throw new NotFoundException(`Không tìm thấy loại sản phẩm với ID: ${id}`);
    }

    // Gắn đường dẫn đầy đủ cho ảnh nếu tồn tại
    if (typeProduct.image && !typeProduct.image.startsWith('http')) {
      const host = process.env.HOST_API_URL || 'http://localhost:3087/api';
      typeProduct.image = `${host}/${typeProduct.image}`;
    }

    return typeProduct;
  }


  async update(id: number, updateTypeProductDto: UpdateTypeProductDto, image?: Express.Multer.File) {
    // console.log(id,updateTypeProductDto, image)
    const { name, grades } = updateTypeProductDto
    const isID: TypeProduct = await this.repo.findOne({ where: { id } , relations: ['createdBy', 'grades'],})
    if (!isID) {
      throw new NotFoundException(`Không tìm thấy loại sản phẩm với ID: ${id}`)
    }
    const isName: TypeProduct = await this.repo.findOne({ where: { name, id: Not(id) } })

    if (isName) {
      throw new HttpException('Tên đã tồn tại', 409)
    }

    if (image) {
      const imageUrl = await this.uploadImage(image); // Gọi hàm upload để xử lý file image
      updateTypeProductDto.image = imageUrl; // Lưu URL của ảnh vào DTO
    } else {
      // Nếu không có file mới, giữ nguyên ảnh cũ
      updateTypeProductDto.image = isID.image;
    }
    // Cập nhật danh sách grades nếu có
    let newGrades : Grade[] = []
    if (grades && Array.isArray(grades)) {
      newGrades = await this.gradeRepo.find({where: {id: In(grades)}})

      if (newGrades.length !== grades.length) {
        throw new NotFoundException('Một hoặc nhiều grade không tồn tại');
      }

      isID.grades = newGrades;
    }
    // console.log(updateTypeProductDto)
    const { grades: _, ...restDto } = updateTypeProductDto;
    const merged = this.repo.merge(isID, restDto);
    return await this.repo.save(merged);

  }
  async uploadImage(image: Express.Multer.File): Promise<string> {
    const filePath = `public/type-product/image/${image.filename}`; // Định dạng đường dẫn lưu ảnh
    // Giả sử bạn lưu ảnh vào thư mục public hoặc thư mục nào đó trên server
    return filePath; // Trả về đường dẫn của ảnh đã lưu
  }
  async remove(id: number) {
    const checkID = await this.repo.findOne({ where: { id } })

    if (!checkID) {
      throw new NotFoundException(` Không tìm thấy loại sản phẩm với ID: ${id}`)
    }
    await this.repo.delete(id)
    return new ItemDto(await this.repo.delete(id))
  }
}
