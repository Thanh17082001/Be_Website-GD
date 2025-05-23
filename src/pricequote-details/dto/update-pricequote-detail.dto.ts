import { PartialType } from '@nestjs/swagger';
import { CreatePricequoteDetailDto } from './create-pricequote-detail.dto';

export class UpdatePricequoteDetailDto extends PartialType(CreatePricequoteDetailDto) {}
