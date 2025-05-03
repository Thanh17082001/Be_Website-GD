import { PartialType } from '@nestjs/swagger';
import { CreateTypeParentDto } from './create-type-parent.dto';

export class UpdateTypeParentDto extends PartialType(CreateTypeParentDto) {}
