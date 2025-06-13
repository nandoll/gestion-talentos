import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCandidateDto } from './create-candidate.dto';

// Permite actualizar cualquier campo excepto los que se generan automáticamente
export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {}
