import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum Seniority {
  JUNIOR = 'junior',
  SENIOR = 'senior',
}

export class CreateCandidateDto {
  @ApiProperty({
    description: 'Nombre del candidato',
    example: 'Juan',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  @Transform(({ value }) => value?.trim()) // Elimina espacios en blanco
  name: string;

  @ApiProperty({
    description: 'Apellido del candidato',
    example: 'Pérez',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @Length(2, 100, {
    message: 'El apellido debe tener entre 2 y 100 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  surname: string;

  @ApiProperty({
    description: 'Nivel de experiencia del candidato',
    enum: Seniority,
    example: Seniority.JUNIOR,
  })
  @IsEnum(Seniority, {
    message: 'El seniority debe ser junior o senior',
  })
  seniority: Seniority;

  @ApiProperty({
    description: 'Años de experiencia profesional',
    example: 3,
    minimum: 0,
    maximum: 50,
  })
  @IsInt({ message: 'Los años de experiencia deben ser un número entero' })
  @Min(0, { message: 'Los años de experiencia no pueden ser negativos' })
  @Max(50, { message: 'Los años de experiencia no pueden superar 50' })
  @Transform(({ value }) => parseInt(value, 10)) // Convierte string a número
  yearsExperience: number;

  @ApiProperty({
    description: 'Disponibilidad actual del candidato',
    example: true,
  })
  @IsBoolean({ message: 'La disponibilidad debe ser verdadero o falso' })
  @Transform(({ value }) => {
    // Maneja diferentes formatos de boolean
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
  })
  availability: boolean;
}
