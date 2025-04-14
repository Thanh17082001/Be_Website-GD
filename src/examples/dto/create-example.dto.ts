import { ApiProduces, ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateExampleDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;
}
