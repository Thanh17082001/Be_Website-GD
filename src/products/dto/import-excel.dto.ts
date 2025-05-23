import { ApiProperty } from "@nestjs/swagger";
export class ImportFileExcelUser {
    @ApiProperty({
        format: 'binary',
        required: true
    })
    file: any; 
}