import { PartialType } from '@nestjs/swagger';
import { CreateHortifruitDto } from './create-hortifruit.dto';

export class UpdateHortifruitDto extends PartialType(CreateHortifruitDto) {}
