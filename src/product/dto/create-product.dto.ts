import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";
import { BaseDto } from "src/common/dto/base.dto";

export class CreateProductDto extends OmitType(BaseDto,[] as const){
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty()
  @IsString()
  origin: string;

  @ApiProperty()
  @IsString()
  model: string;

  @ApiProperty()
  @IsString()
  trademark: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  // @IsArray()
  images?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  // @IsNumber()
  gradeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  // @IsNumber()
  classId?: string;
}
