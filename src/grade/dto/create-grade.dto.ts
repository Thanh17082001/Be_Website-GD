import { OmitType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateGradeDto extends OmitType(BaseDto, ['isPublic'] as const){
    @IsString()
    @IsNotEmpty()
    name: string
}
