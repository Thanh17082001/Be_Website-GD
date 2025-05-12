import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreateCartDetailDto } from "src/cart-detail/dto/create-cart-detail.dto";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateCartDto extends OmitType(BaseDto, [] as const) {

    @ApiProperty({ type: [CreateCartDetailDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCartDetailDto)
    details?: CreateCartDetailDto[];
}
