import { Injectable } from '@nestjs/common';
import { CreateCandidateDto } from '../dto/create-candidate.dto';

/**
 * Servicio para validaciones de negocio adicionales
 * Separado del servicio principal para mantener responsabilidad única
 */
@Injectable()
export class CandidateValidatorService {
  //Valida la coherencia entre seniority y años de experiencia
  validateExperienceCoherence(
    seniority: string,
    yearsExperience: number
  ): boolean {
    // Reglas de negocio:
    // - Junior: típicamente 0-3 años
    // - Senior: típicamente 4+ años
    if (seniority === 'junior' && yearsExperience > 5) {
      // Podríamos lanzar una advertencia pero no bloquear
      console.warn(
        `Candidato junior con ${yearsExperience} años de experiencia`
      );
    }

    if (seniority === 'senior' && yearsExperience < 2) {
      console.warn(
        `Candidato senior con solo ${yearsExperience} años de experiencia`
      );
    }

    return true;
  }

  //Normaliza los datos del candidato antes de guardar
  normalizeCandidate(candidate: CreateCandidateDto): CreateCandidateDto {
    return {
      ...candidate,
      name: this.normalizeName(candidate.name),
      surname: this.normalizeName(candidate.surname),
    };
  }

  //Normaliza nombres: capitaliza primera letra, resto en minúsculas
  private normalizeName(name: string): string {
    return name
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
