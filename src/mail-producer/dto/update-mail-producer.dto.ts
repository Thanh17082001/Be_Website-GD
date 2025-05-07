import { PartialType } from '@nestjs/swagger';
import { CreateMailProducerDto } from './create-mail-producer.dto';

export class UpdateMailProducerDto extends PartialType(CreateMailProducerDto) {}
