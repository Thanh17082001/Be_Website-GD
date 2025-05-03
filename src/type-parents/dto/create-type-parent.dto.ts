import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateTypeParentDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    name: string

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsString({ each: true })
    grades: string[];
}
