import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from "@nestjs/jwt";
import { User } from "src/users/entities/user.entity"; 
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private repoUser: Repository<User>,
   private jwtService: JwtService,
 ) { }
  async logIn(data: LoginDto): Promise<any> {
    const user = await this.repoUser?.findOne({
      where: {email: data.email},
    })
    if(!user) {
      throw new NotFoundException(`Tài khoản hoặc mật khẩu không đúng`)
    }
    const isPass = await bcrypt.compare(data.password, user.password)
    if(!isPass) {
      throw new BadRequestException(`Tài khoản hoặc mật khẩu không đúng`)
    }
    const payload = {...user, password: undefined}
    const accessToken = this.jwtService.sign(payload)

    return {
      ...payload,
      accessToken: accessToken
    }
  }
}
