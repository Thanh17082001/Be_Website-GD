import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt } from "class-validator";

export class UpdateCartDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  productId: number;
}