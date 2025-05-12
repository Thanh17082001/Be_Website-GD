import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsInt } from "class-validator";

export class CreateCartDetailDto {
    @ApiProperty()
    @IsInt()
    @Expose()
    productId: number;

    @ApiProperty()
    @IsInt()
    @Expose()
    quantity: number;
}
