import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Seniority } from '../models/candidate.model';
import * as XLSX from 'xlsx';

export interface ExcelCandidateData {
  seniority: Seniority;
  yearsExperience: number;
  availability: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ExcelProcessorService {
  //Procesa un archivo Excel para extraer datos de un candidato individual
  processIndividualCandidateFile(file: File): Observable<ExcelCandidateData> {
    return this.validateAndProcessFile(file);
  }

  private validateAndProcessFile(file: File): Observable<ExcelCandidateData> {
    // Validar tipo de archivo
    if (!this.isValidExcelFile(file)) {
      return throwError(
        () =>
          new Error('Archivo no válido. Solo se permiten archivos .xlsx y .xls')
      );
    }

    // Validar tamaño del archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return throwError(
        () => new Error('El archivo es demasiado grande. Máximo 5MB')
      );
    }

    // Procesar archivo Excel realmente
    return this.processExcelFile(file);
  }

  private isValidExcelFile(file: File): boolean {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some((ext) => fileName.endsWith(ext));
  }

  private processExcelFile(file: File): Observable<ExcelCandidateData> {
    return new Observable((observer) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // Obtener la primera hoja
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null,
            blankrows: false,
            raw: false,
          });

          if (jsonData.length === 0) {
            observer.error(new Error('El archivo Excel está vacío'));
            return;
          }

          // Detectar si la primera fila contiene headers o datos
          const firstRow = jsonData[0] as any[];
          let dataRow: any[];

          if (this.isHeaderRow(firstRow)) {
            // Caso normal: primera fila = headers, segunda fila = datos
            if (jsonData.length < 2) {
              observer.error(
                new Error('El archivo Excel debe contener una fila de datos')
              );
              return;
            }
            dataRow = jsonData[1] as any[];
          } else {
            // Caso especial: no hay headers, primera fila = datos
            dataRow = firstRow;
          }

          // Extraer datos asumiendo orden: seniority, years, availability
          const [seniorityRaw, yearsRaw, availabilityRaw] = dataRow;

          // Procesar seniority
          const seniority = String(seniorityRaw).toLowerCase().trim();
          if (!['junior', 'senior'].includes(seniority)) {
            observer.error(
              new Error(
                `Seniority inválido: "${seniorityRaw}". Debe ser "junior" o "senior"`
              )
            );
            return;
          }

          // Procesar años de experiencia
          const yearsExperience = parseInt(String(yearsRaw), 10);
          if (
            isNaN(yearsExperience) ||
            yearsExperience < 0 ||
            yearsExperience > 50
          ) {
            observer.error(
              new Error(
                `Años de experiencia inválidos: "${yearsRaw}". Debe ser un número entre 0 y 50`
              )
            );
            return;
          }

          // Procesar disponibilidad
          const availability = this.parseBoolean(availabilityRaw);

          observer.next({
            seniority: seniority as Seniority,
            yearsExperience,
            availability,
          });
          observer.complete();
        } catch (error) {
          observer.error(
            new Error(
              'Error al procesar el archivo Excel: ' + (error as Error).message
            )
          );
        }
      };

      reader.onerror = () => {
        observer.error(new Error('Error al leer el archivo'));
      };

      reader.readAsBinaryString(file);
    });
  }

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
    throw new Error(
      `No se pudo interpretar el valor de disponibilidad: "${value}"`
    );
  }

  //Obtiene el formato esperado del archivo Excel
  getExpectedFormat(): {
    headers: string[];
    example: Record<string, string | number | boolean>;
    notes: string[];
  } {
    return {
      headers: ['Seniority', 'Años Experiencia', 'Disponibilidad'],
      example: {
        Seniority: 'senior',
        'Años Experiencia': 5,
        Disponibilidad: 'si',
      },
      notes: [
        'El archivo debe tener una sola fila de datos, además del encabezado',
        'Seniority: debe ser "junior" o "senior"',
        'Años Experiencia: número entero entre 0 y 50',
        'Disponibilidad: "si", "sí", "yes", "true" para disponible; cualquier otro valor para no disponible',
      ],
    };
  }
}
