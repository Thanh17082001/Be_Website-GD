import { IsArray, IsNumber, IsString } from "class-validator";

export class CreatePricequoteDetailDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsString()
    content: string;

    @IsString()
    apply: string;

    @IsString()
    origin: string;

    @IsString()
    model: string;

    @IsString()
    trademark: string;

    @IsString()
    code: string;

    @IsArray()
    @IsString({ each: true })
    images: string[];

    @IsNumber()
    quantity: number;

    @IsString()
    grades: string;

    @IsString()
    classes: string;

    @IsString()
    subjects: string;

    @IsString()
    typeProduct: string;

    @IsString()
    categories: string;

    @IsString()
    typeParent: string;
}
