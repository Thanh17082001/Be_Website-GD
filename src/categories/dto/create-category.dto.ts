import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateCategoryDto extends OmitType(BaseDto, [] as const){
        @ApiProperty()
        @IsString()
        @IsNotEmpty()
        name: string;
    
        // @ApiProperty({ type: [Number] }) 
        // @IsArray()
        // @ArrayNotEmpty()
        // @IsNumber({}, { each: true }) 
        // @Type(() => Number) 
        // products: number[];

        @ApiProperty({ type: [String], required: false })
        @IsArray()
        @IsString({ each: true })
        grades?: string[];
}
