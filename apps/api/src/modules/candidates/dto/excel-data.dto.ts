import { ApiProperty } from '@nestjs/swagger';

// DTO que representa los datos extraídos del archivo Excel
export class ExcelDataDto {
  @ApiProperty({
    description: 'Nivel de experiencia ',
    example: 'junior',
    enum: ['junior', 'senior'],
  })
  seniority: string;

  @ApiProperty({
    description: 'Años de experiencia ',
    example: 5,
    minimum: 0,
    maximum: 50,
  })
  yearsExperience: number;

  @ApiProperty({
    description: 'Disponibilidad ',
    example: true,
  })
  availability: boolean;
}
