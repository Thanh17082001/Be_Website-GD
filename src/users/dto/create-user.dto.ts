import { IsEmail, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
    @IsString()
    fullName: string;

    @IsString()
    username: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;

    // @IsNotEmpty()
    // @IsNumber()
    // schoolId: number;

    // @IsArray()
    // gradeIds: number[];

    // @IsArray()
    // subjectIds: number[];

    @IsOptional()
    isAdmin?: boolean = false;
    
    @IsOptional()
    role: string = 'khách hàng';
}
