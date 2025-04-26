import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateContactDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    name: string

    @ApiProperty()
    @IsString()
    phone: string

    @ApiProperty()
    @IsString()
    address: string
    
    @ApiProperty()
    @IsString()
    messages: string

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    // @IsNumber()
    user?: string;
}
