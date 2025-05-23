import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";
import { CreatePricequoteDetailDto } from "src/pricequote-details/dto/create-pricequote-detail.dto";
import { Status } from "src/status/status.enum";

export class CreatePricequoteDto extends OmitType(BaseDto, [] as const) {
    @ApiProperty()
    @IsString()
    fullName: string

    @ApiProperty()
    @IsString()
    phone: string

    @ApiProperty()
    @IsString()
    address: string

    @ApiProperty()
    @IsString()
    email: string

    @ApiProperty()
    @IsString()
    messages: string

    @IsOptional()
    @IsEnum(Status)
    status?: Status;

    @ApiProperty({ type: [CreatePricequoteDetailDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePricequoteDetailDto)
    details: CreatePricequoteDetailDto[];
}
