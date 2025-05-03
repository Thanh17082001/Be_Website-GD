import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateSolutionDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    title: string

    @ApiProperty()
    @IsString()
    content: string
}
