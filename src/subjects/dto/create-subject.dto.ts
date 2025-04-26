import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateSubjectDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ type: [String] }) 
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true }) 
    @Type(() => String)
    grades: string[];

    @ApiProperty({ type: [String] }) 
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true }) 
    @Type(() => String)
    classes: string[]; 
}