import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Candidate } from '@prisma/client';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  Seniority,
  CandidateResponseDto,
  PaginatedCandidatesDto,
} from './dto';
import { ExcelProcessorService } from './services/excel-processor.service';
import { CandidateValidatorService } from './services/candidate-validator.service';

//Servicio principal para la gestión de candidatos

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly excelProcessor: ExcelProcessorService,
    private readonly validator: CandidateValidatorService
  ) {}

  //Crea un nuevo candidato con todos sus datos
  async create(
    createCandidateDto: CreateCandidateDto
  ): Promise<CandidateResponseDto> {
    try {
      this.logger.log(
        `Creando candidato: ${createCandidateDto.name} ${createCandidateDto.surname}`
      );

      // Normalizar datos antes de guardar
      const normalizedData =
        this.validator.normalizeCandidate(createCandidateDto);

      // Validar coherencia de datos
      this.validator.validateExperienceCoherence(
        normalizedData.seniority,
        normalizedData.yearsExperience
      );

      // Crear el candidato en la base de datos
      const candidate = await this.prisma.candidate.create({
        data: {
          name: normalizedData.name,
          surname: normalizedData.surname,
          seniority: normalizedData.seniority,
          yearsExperience: normalizedData.yearsExperience,
          availability: normalizedData.availability,
        },
      });

      this.logger.log(`Candidato creado exitosamente con ID: ${candidate.id}`);
      return this.mapToResponseDto(candidate);
    } catch (error) {
      this.logger.error('Error al crear candidato', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(
          'Error al guardar el candidato en la base de datos'
        );
      }
      throw new InternalServerErrorException(
        'Error inesperado al crear el candidato'
      );
    }
  }

  /**
   * MÉTODO PRINCIPAL: Crea un candidato procesando un archivo Excel
   * Este es el flujo principal:
   * 1. Recibe nombre y apellido del formulario
   * 2. Procesa el Excel para obtener seniority, años de experiencia y disponibilidad
   * 3. Combina ambos y guarda en la base de datos
   * 4. Retorna el JSON combinado para almacenamiento incremental en el frontend
   */
  async createWithExcel(
    name: string,
    surname: string,
    file: Express.Multer.File
  ): Promise<CandidateResponseDto> {
    try {
      this.logger.log(
        `Procesando candidato ${name} ${surname} con archivo Excel`
      );

      // Paso 1: Procesar el archivo Excel
      const excelData = await this.excelProcessor.processExcelFile(file);

      // Paso 2: Combinar datos del formulario con datos del Excel
      const candidateData: CreateCandidateDto = {
        name: name.trim(),
        surname: surname.trim(),
        seniority: excelData.seniority as Seniority,
        yearsExperience: excelData.yearsExperience,
        availability: excelData.availability,
      };

      // Paso 3: Usar el método create para guardar (reutilizamos lógica)
      return await this.create(candidateData);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error al procesar candidato con Excel', error);
      throw new InternalServerErrorException(
        'Error al procesar el candidato con archivo Excel'
      );
    }
  }

  // Obtiene todos los candidatos con paginación
  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    seniority?: Seniority,
    availability?: boolean
  ): Promise<PaginatedCandidatesDto> {
    try {
      this.logger.debug(
        `Obteniendo candidatos - Página: ${page}, Límite: ${limit}`
      );

      // Construir condiciones de filtrado dinámicamente
      const where: Prisma.CandidateWhereInput = {};

      if (search) {
        const searchTerm = search.trim();
        where.OR = [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            surname: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            AND: [
              {
                name: {
                  contains: searchTerm.split(' ')[0],
                  mode: 'insensitive',
                },
              },
              {
                surname: {
                  contains: searchTerm.split(' ')[1] || '',
                  mode: 'insensitive',
                },
              },
            ],
          },
        ];
      }

      if (seniority) {
        where.seniority = seniority;
      }

      if (availability !== undefined) {
        where.availability = availability;
      }

      // Calcular offset para paginación
      const skip = (page - 1) * limit;

      // Ejecutar consultas en paralelo para mejor rendimiento
      const [candidates, total] = await Promise.all([
        this.prisma.candidate.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { createdAt: 'desc' }, // Más recientes primero
            { name: 'asc' }, // Orden alfabético secundario
          ],
          select: {
            id: true,
            name: true,
            surname: true,
            seniority: true,
            yearsExperience: true,
            availability: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.candidate.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(
        `Encontrados ${candidates.length} candidatos de un total de ${total}`
      );

      return {
        data: candidates.map((candidate) => this.mapToResponseDto(candidate)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error al obtener candidatos', error);
      throw new InternalServerErrorException(
        'Error al obtener la lista de candidatos'
      );
    }
  }

  //Busca un candidato específico por ID

  async findOne(id: string): Promise<CandidateResponseDto> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id },
      });

      if (!candidate) {
        throw new NotFoundException(`Candidato con ID ${id} no encontrado`);
      }

      return this.mapToResponseDto(candidate);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al buscar candidato ${id}`, error);
      throw new InternalServerErrorException('Error al buscar el candidato');
    }
  }

  //Actualiza un candidato existente
  async update(
    id: string,
    updateCandidateDto: UpdateCandidateDto
  ): Promise<CandidateResponseDto> {
    try {
      // Verificar que el candidato existe
      await this.findOne(id);

      // Si se están actualizando seniority y experiencia, validar coherencia
      if (
        updateCandidateDto.seniority &&
        updateCandidateDto.yearsExperience !== undefined
      ) {
        this.validator.validateExperienceCoherence(
          updateCandidateDto.seniority,
          updateCandidateDto.yearsExperience
        );
      }

      const candidate = await this.prisma.candidate.update({
        where: { id },
        data: updateCandidateDto,
      });

      this.logger.log(`Candidato ${id} actualizado exitosamente`);
      return this.mapToResponseDto(candidate);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al actualizar candidato ${id}`, error);
      throw new InternalServerErrorException(
        'Error al actualizar el candidato'
      );
    }
  }

  //Elimina un candidato
  async remove(id: string): Promise<void> {
    try {
      // Verificar que el candidato existe
      await this.findOne(id);

      await this.prisma.candidate.delete({
        where: { id },
      });

      this.logger.log(`Candidato ${id} eliminado exitosamente`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al eliminar candidato ${id}`, error);
      throw new InternalServerErrorException('Error al eliminar el candidato');
    }
  }

  /**
   * Obtiene estadísticas de candidatos
   * Útil para dashboards o reportes
   */
  async getStatistics() {
    const [totalCandidates, bySeniority, availableCandidates] =
      await Promise.all([
        this.prisma.candidate.count(),
        this.prisma.candidate.groupBy({
          by: ['seniority'],
          _count: {
            seniority: true,
          },
        }),
        this.prisma.candidate.count({
          where: { availability: true },
        }),
      ]);

    const avgExperience = await this.prisma.candidate.aggregate({
      _avg: {
        yearsExperience: true,
      },
    });

    return {
      total: totalCandidates,
      available: availableCandidates,
      unavailable: totalCandidates - availableCandidates,
      bySeniority: bySeniority.reduce((acc, item) => {
        acc[item.seniority] = item._count.seniority;
        return acc;
      }, {} as Record<string, number>),
      averageExperience: Math.round(avgExperience._avg.yearsExperience || 0),
    };
  }

  /**
   * Mapea una entidad Candidate a CandidateResponseDto
   * Asegura que la respuesta tenga el formato esperado por el frontend
   */
  private mapToResponseDto(candidate: Candidate): CandidateResponseDto {
    return {
      id: candidate.id,
      name: candidate.name,
      surname: candidate.surname,
      seniority: candidate.seniority as Seniority,
      yearsExperience: candidate.yearsExperience,
      availability: candidate.availability,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    };
  }
}
