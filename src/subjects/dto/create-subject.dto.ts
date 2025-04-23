import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateSubjectDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    gradeId: number;

    // @ApiProperty({ type: [Number] })
    // @IsArray()
    // @ArrayNotEmpty()
    // @IsNumber({}, { each: true })
    // @Type(() => Number)
    // productIds: number[];

    @ApiProperty({ type: [Number] })
    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { each: true })
    @Type(() => Number)
    classes: number[];
}
