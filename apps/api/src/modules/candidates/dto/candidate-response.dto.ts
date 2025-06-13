import { ApiProperty } from '@nestjs/swagger';
import { Seniority } from './create-candidate.dto';

/**
 * DTO de respuesta para un candidato
 * Este es el formato JSON que se almacena incrementalmente en el frontend
 */
export class CandidateResponseDto {
  @ApiProperty({
    description: 'ID único del candidato',
    example: 'clh1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del candidato',
    example: 'Juan',
  })
  name: string;

  @ApiProperty({
    description: 'Apellido del candidato',
    example: 'Pérez',
  })
  surname: string;

  @ApiProperty({
    description: 'Nivel de experiencia',
    enum: Seniority,
    example: Seniority.JUNIOR,
  })
  seniority: Seniority;

  @ApiProperty({
    description: 'Años de experiencia',
    example: 3,
  })
  yearsExperience: number;

  @ApiProperty({
    description: 'Disponibilidad actual',
    example: true,
  })
  availability: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2025-06-10T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-06-10T10:30:00Z',
  })
  updatedAt: Date;
}

