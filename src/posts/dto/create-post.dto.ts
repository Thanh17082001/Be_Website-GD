import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreatePostDto extends OmitType(BaseDto,['isPublic'] as const){

    @ApiProperty()
    @IsString()
    name: string

    @ApiProperty()
    @IsString()
    title: string

    @ApiProperty()
    @IsString()
    content: string

    @ApiProperty({ type: 'string', format: 'binary' })
    // @IsString()
    images: any

    @ApiProperty()
    @IsString()
    description : string
}
