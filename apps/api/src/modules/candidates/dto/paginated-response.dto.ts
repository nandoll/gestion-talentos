import { ApiProperty } from '@nestjs/swagger';
import { CandidateResponseDto } from './candidate-response.dto';

/**
 * DTO para respuestas paginadas
 * Facilita el manejo de grandes volúmenes de datos en el frontend
 */
export class PaginatedCandidatesDto {
  @ApiProperty({
    description: 'Lista de candidatos en la página actual',
    type: [CandidateResponseDto],
    isArray: true,
  })
  data: CandidateResponseDto[];

  @ApiProperty({
    description: 'Total de candidatos en la base de datos',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1,
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Número de elementos por página',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  limit: number;

  @ApiProperty({
    description: 'Total de páginas disponibles',
    example: 10,
    minimum: 0,
  })
  totalPages: number;
}
