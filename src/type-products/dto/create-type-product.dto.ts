import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateTypeProductDto extends OmitType(BaseDto, [] as const) {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty({ type: 'string', format: 'binary' })
  // @IsString()
  images: any

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsString({ each: true })
  grades: string[];
}
