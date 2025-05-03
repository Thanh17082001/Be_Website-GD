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
  apply: string;

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

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsString({ each: true })
  grades?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsString({ each: true })
  subjects?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsString({ each: true })
  classes?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  typeProduct?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  typeParent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categories?: string;
}
