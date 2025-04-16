import { HttpException, Injectable } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { Grade } from 'src/grade/entities/grade.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class) private repo: Repository<Class>,
    @InjectRepository(Grade) private repoGrade: Repository<Grade>,
  ){}
  async create(createClassDto: CreateClassDto, user: User){
    console.log(createClassDto)
    // const { name, gradeId } = createClassDto;
    // if (await this.repo.findOne({ where: { name } })) {
    //   throw new HttpException('Tên đã tồn tại', 409);
    // }
    // const grade: Grade = await this.repoGrade.findOne({ where: { id: gradeId } });
    // if (!grade) {
    //   throw new HttpException('Lớp không tồn tại', 409);
    // }
    // console.log(grade)
    // const newClass = this.repo.create({ ...createClassDto, name: name, grade, createdBy: user.isAdmin ? null : user });
    // return await this.repo.save(newClass);
  }

  findAll() {
    return `This action returns all class`;
  }

  findOne(id: number) {
    return `This action returns a #${id} class`;
  }

  update(id: number, updateClassDto: UpdateClassDto) {
    return `This action updates a #${id} class`;
  }

  remove(id: number) {
    return `This action removes a #${id} class`;
  }
}
