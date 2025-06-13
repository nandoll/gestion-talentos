import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO específico para el endpoint de creación con Excel
 * Solo incluye los campos del formulario, el Excel se procesa aparte
 */
export class CreateCandidateWithExcelDto {
  @ApiProperty({
    description: 'Nombre del candidato',
    example: 'María',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(2, 100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Apellido del candidato',
    example: 'García',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @Length(2, 100)
  @Transform(({ value }) => value?.trim())
  surname: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Archivo Excel con los datos adicionales del candidato',
  })
  file: any; // Este campo será manejado por Multer
}
