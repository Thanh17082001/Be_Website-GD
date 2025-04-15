import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    fullName?: string;
  
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsEmail()
    email: string;
  
    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    isAdmin?: boolean = false;

}

