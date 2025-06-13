import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ExcelDataDto } from '../dto/excel-data.dto';

/**
 * Servicio para procesar archivos Excel
 * Maneja la lógica de parseo y validación de datos Excel
 */
@Injectable()
export class ExcelProcessorService {
  private readonly logger = new Logger(ExcelProcessorService.name);

  /**
   * Procesa un archivo Excel y extrae los datos del candidato:
   * - Seniority (junior | senior)
   * - Years of experience (number)
   * - Availability (boolean)
   */
  async processExcelFile(file: Express.Multer.File): Promise<ExcelDataDto> {
    try {
      this.logger.log(`Procesando archivo Excel: ${file.originalname}`);

      // Leer el archivo Excel desde el buffer
      const workbook = XLSX.read(file.buffer, {
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellStyles: false,
      });

      // Validar que el archivo no esté vacío
      if (!workbook.SheetNames.length) {
        throw new BadRequestException('El archivo Excel está vacío');
      }

      // Obtener la primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON con opciones específicas
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Usar array indexado
        defval: null, // Valor por defecto para celdas vacías
        blankrows: false, // Ignorar filas en blanco
        raw: false, // Convertir valores a string
      });

      // Validar estructura mínima
      if (jsonData.length < 1) {
        throw new BadRequestException(
          'El archivo Excel debe contener al menos una fila de datos'
        );
      }

      // Detectar si la primera fila contiene headers o datos
      const firstRow = jsonData[0] as any[];
      let headers: string[];
      let dataRow: any[];

      if (this.isHeaderRow(firstRow)) {
        // Caso normal: primera fila = headers, segunda fila = datos
        if (jsonData.length < 2) {
          throw new BadRequestException(
            'El archivo Excel debe contener una fila de encabezados y una fila de datos'
          );
        }
        headers = firstRow as string[];
        dataRow = jsonData[1] as any[];
      } else {
        // Caso especial: no hay headers, primera fila = datos
        // Asumir orden: seniority, years of experience, availability
        headers = ['seniority', 'years of experience', 'availability'];
        dataRow = firstRow;
        this.logger.log(
          'No se detectaron headers, asumiendo orden: seniority, years, availability'
        );
      }

      this.logger.debug(`Encabezados encontrados: ${headers.join(', ')}`);
      this.logger.debug(`Datos de la fila: ${dataRow.join(', ')}`);

      // Mapear los datos según los encabezados
      const mappedData = this.mapExcelDataToDto(headers, dataRow);

      this.logger.debug(`Datos mapeados: ${JSON.stringify(mappedData)}`);

      // Validar los datos extraídos
      this.validateExcelData(mappedData);

      this.logger.log('Archivo Excel procesado exitosamente');
      return mappedData;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error al procesar archivo Excel', error);
      throw new BadRequestException(
        'Error al procesar el archivo Excel. Verifique que el formato sea correcto.'
      );
    }
  }

  /**
   * Mapea los datos del Excel a DTO
   * Es flexible con las variaciones en los nombres de columnas
   */
  private mapExcelDataToDto(headers: string[], dataRow: any[]): ExcelDataDto {
    const data: Partial<ExcelDataDto> = {};

    // Crear un mapa de índices para búsqueda eficiente
    const headerMap = new Map<string, number>();
    headers.forEach((header, index) => {
      if (header) {
        headerMap.set(header.toLowerCase().trim(), index);
      }
    });

    this.logger.debug(
      `Header map creado: ${JSON.stringify(Array.from(headerMap.entries()))}`
    );

    // Buscar y extraer Seniority
    const seniorityIndex = this.findColumnIndex(headerMap, [
      'seniority',
      'nivel',
      'level',
    ]);
    if (seniorityIndex !== -1) {
      const rawSeniority = dataRow[seniorityIndex];
      data.seniority = String(rawSeniority).toLowerCase().trim();
      this.logger.debug(
        `Seniority extraído: "${rawSeniority}" -> "${data.seniority}" (índice: ${seniorityIndex})`
      );
    } else {
      this.logger.warn('No se encontró columna de seniority');
    }

    // Buscar y extraer Years of Experience
    const yearsIndex = this.findColumnIndex(headerMap, [
      'years of experience',
      'years',
      'experience',
      'años de experiencia',
      'experiencia',
    ]);
    if (yearsIndex !== -1) {
      const rawYears = dataRow[yearsIndex];
      data.yearsExperience = parseInt(String(rawYears), 10);
      this.logger.debug(
        `Years extraído: "${rawYears}" -> ${data.yearsExperience} (índice: ${yearsIndex})`
      );
    } else {
      this.logger.warn('No se encontró columna de años de experiencia');
    }

    // Buscar y extraer Availability
    const availabilityIndex = this.findColumnIndex(headerMap, [
      'availability',
      'available',
      'disponibilidad',
      'disponible',
    ]);
    if (availabilityIndex !== -1) {
      const rawAvailability = dataRow[availabilityIndex];
      data.availability = this.parseBoolean(rawAvailability);
      this.logger.debug(
        `Availability extraído: "${rawAvailability}" -> ${data.availability} (índice: ${availabilityIndex})`
      );
    } else {
      this.logger.warn('No se encontró columna de disponibilidad');
    }

    return data as ExcelDataDto;
  }

  //Busca el índice de una columna basándose en posibles nombres
  private findColumnIndex(
    headerMap: Map<string, number>,
    possibleNames: string[]
  ): number {
    for (const name of possibleNames) {
      const index = headerMap.get(name);
      if (index !== undefined) {
        return index;
      }
    }
    return -1;
  }

  //Detecta si la primera fila contiene headers o datos
  private isHeaderRow(row: any[]): boolean {
    if (!row || row.length === 0) {
      return false;
    }

    // Si tiene 3 elementos y sigue el patrón exacto de datos esperados, no es header
    if (row.length === 3) {
      const [first, second, third] = row;

      // Verificar si es patrón de datos: seniority, number, boolean
      const firstIsValidSeniority =
        typeof first === 'string' &&
        ['junior', 'senior'].includes(first.toString().toLowerCase().trim());
      const secondIsNumber = !isNaN(parseInt(second));
      const thirdIsBoolean = this.isBooleanValue(third);

      if (firstIsValidSeniority && secondIsNumber && thirdIsBoolean) {
        return false; // Es una fila de datos, no headers
      }
    }

    // Buscar palabras típicas de headers
    const headerKeywords = [
      'seniority',
      'nivel',
      'level',
      'years',
      'experience',
      'experiencia',
      'años',
      'availability',
      'disponibilidad',
      'available',
      'disponible',
    ];

    return row.some((cell) => {
      if (typeof cell !== 'string') return false;
      const cellText = cell.toLowerCase().trim();
      return headerKeywords.some((keyword) => cellText.includes(keyword));
    });
  }

  // Verifica si un valor puede ser interpretado como boolean
  private isBooleanValue(value: any): boolean {
    if (typeof value === 'boolean') {
      return true;
    }

    const strValue = String(value).toLowerCase().trim();
    const booleanValues = [
      'true',
      'false',
      '1',
      '0',
      'si',
      'sí',
      'no',
      'yes',
      'y',
      'n',
      't',
      'f',
      'verdadero',
      'falso',
    ];

    return booleanValues.includes(strValue);
  }

  //Convierte diversos formatos de boolean a boolean real
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    const strValue = String(value).toLowerCase().trim();
    const trueValues = ['true', '1', 'si', 'sí', 'yes', 'y', 't', 'verdadero'];
    const falseValues = ['false', '0', 'no', 'n', 'f', 'falso'];

    if (trueValues.includes(strValue)) {
      return true;
    }

    if (falseValues.includes(strValue)) {
      return false;
    }

    // Si no se puede determinar, lanzar error
    throw new BadRequestException(
      `No se pudo interpretar el valor de disponibilidad: "${value}"`
    );
  }

  //Valida que los datos extraídos del Excel sean correctos
  private validateExcelData(data: ExcelDataDto): void {
    const errors: string[] = [];

    // Validar seniority
    if (!data.seniority) {
      errors.push('La columna "Seniority" es requerida');
    } else if (!['junior', 'senior'].includes(data.seniority)) {
      errors.push(
        `El nivel de experiencia debe ser "junior" o "senior", se encontró: "${data.seniority}"`
      );
    }

    // Validar años de experiencia
    if (data.yearsExperience === undefined || data.yearsExperience === null) {
      errors.push('La columna "Years of experience" es requerida');
    } else if (isNaN(data.yearsExperience)) {
      errors.push('Los años de experiencia deben ser un número');
    } else if (data.yearsExperience < 0 || data.yearsExperience > 50) {
      errors.push('Los años de experiencia deben estar entre 0 y 50');
    }

    // Validar disponibilidad
    if (data.availability === undefined || data.availability === null) {
      errors.push('La columna "Availability" es requerida');
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('. '));
    }
  }
}
