import { PartialType } from '@nestjs/swagger';
import { CreatePricequoteDto } from './create-pricequote.dto';

export class UpdatePricequoteDto extends PartialType(CreatePricequoteDto) {}
