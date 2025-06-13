import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  ValidationPipe,
  Logger,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateResponseDto,
  PaginatedCandidatesDto,
  Seniority,
} from './dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import multer from 'multer';
@ApiTags('Candidatos')
@Controller('candidates')
@ApiExtraModels(CandidateResponseDto, PaginatedCandidatesDto)
@ApiInternalServerErrorResponse({
  description: 'Error interno del servidor',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 500 },
      message: { type: 'string', example: 'Internal server error' },
      timestamp: { type: 'string', example: '2025-06-10T10:30:00Z' },
    },
  },
})
export class CandidatesController {
  private readonly logger = new Logger(CandidatesController.name);

  constructor(private readonly candidatesService: CandidatesService) {}

  //Crea un candidato procesando un archivo Excel con información adicional
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Crear candidato con archivo Excel',
    description: `
Endpoint principal.

**Flujo del proceso:**
1. El frontend envía el nombre y apellido del candidato
2. Junto con un archivo Excel que contiene una línea con:
   - **Seniority**: junior o senior
   - **Years of experience**: número entero
   - **Availability**: boolean (true/false)
3. El backend procesa el Excel y combina los datos
4. Retorna el candidato creado en formato JSON

**Importante:**
- El Excel debe contener exactamente una línea de datos, además de los encabezados
- El formato del Excel es flexible en cuanto a nombres de columnas
- Los datos se guardan incrementalmente en el frontend
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos del candidato y archivo Excel',
    schema: {
      type: 'object',
      required: ['name', 'surname', 'file'],
      properties: {
        name: {
          type: 'string',
          description: 'Nombre del candidato',
          example: 'María',
        },
        surname: {
          type: 'string',
          description: 'Apellido del candidato',
          example: 'González',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel con los datos adicionales',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Candidato creado exitosamente',
    type: CandidateResponseDto,
    content: {
      'application/json': {
        example: {
          id: 'clh1234567890abcdef',
          name: 'María',
          surname: 'González',
          seniority: 'senior',
          yearsExperience: 5,
          availability: true,
          createdAt: '2025-06-10T10:30:00Z',
          updatedAt: '2025-06-10T10:30:00Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Error en los datos enviados o formato de Excel incorrecto',
    content: {
      'application/json': {
        examples: {
          'archivo-invalido': {
            value: {
              statusCode: 400,
              message: 'El archivo debe ser un Excel válido (.xlsx o .xls)',
              error: 'Bad Request',
            },
          },
          'datos-faltantes': {
            value: {
              statusCode: 400,
              message: 'El nombre y apellido son requeridos',
              error: 'Bad Request',
            },
          },
          'excel-mal-formateado': {
            value: {
              statusCode: 400,
              message:
                'El archivo Excel debe contener una fila de encabezados y una fila de datos',
              error: 'Bad Request',
            },
          },
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createWithExcel(
    @Body('name') name: string,
    @Body('surname') surname: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<CandidateResponseDto> {
    this.logger.log(
      `POST /candidates/upload - Procesando candidato ${name} ${surname}`
    );

    // Validaciones básicas
    if (!file) {
      throw new BadRequestException('El archivo Excel es requerido');
    }

    if (!name || !surname) {
      throw new BadRequestException('El nombre y apellido son requeridos');
    }

    return this.candidatesService.createWithExcel(name, surname, file);
  }

  //Crea un candidato con todos los datos directamente
  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo candidato',
    description:
      'Crea un candidato proporcionando todos los datos directamente, sin necesidad de archivo Excel.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Candidato creado exitosamente',
    type: CandidateResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: [
            'El nombre es requerido',
            'El seniority debe ser junior o senior',
          ],
          error: 'Bad Request',
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createCandidateDto: CreateCandidateDto
  ): Promise<CandidateResponseDto> {
    this.logger.log('POST /candidates - Creando nuevo candidato');
    return this.candidatesService.create(createCandidateDto);
  }

  // Obtiene la lista de candidatos con paginación y filtros
  @Get()
  @ApiOperation({
    summary: 'Obtener lista de candidatos',
    description:
      'Retorna la lista paginada de candidatos para mostrar en la tabla.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (comienza en 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Candidatos por página (máximo 50)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por nombre o apellido',
    example: 'María González',
  })
  @ApiQuery({
    name: 'seniority',
    required: false,
    enum: Seniority,
    description: 'Filtrar por nivel de experiencia',
  })
  @ApiQuery({
    name: 'availability',
    required: false,
    type: Boolean,
    description: 'Filtrar por disponibilidad',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de candidatos',
    schema: {
      allOf: [{ $ref: '#/components/schemas/PaginatedCandidatesDto' }],
      example: {
        data: [
          {
            id: 'clh1234567890abcdef',
            name: 'María',
            surname: 'González',
            seniority: 'senior',
            yearsExperience: 5,
            availability: true,
            createdAt: '2025-06-10T10:30:00Z',
            updatedAt: '2025-06-10T10:30:00Z',
          },
        ],
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      },
    },
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('seniority') seniority?: Seniority,
    @Query('availability', new DefaultValuePipe(undefined))
    availability?: string
  ): Promise<PaginatedCandidatesDto> {
    this.logger.log(`GET /candidates - Página: ${page}, Límite: ${limit}`);

    // Validar límite máximo
    if (limit > 50) {
      throw new BadRequestException(
        'El límite máximo es 50 elementos por página'
      );
    }

    // Convertir availability a boolean si está presente
    let availabilityBool: boolean | undefined;
    if (availability !== undefined && availability !== '') {
      availabilityBool = availability === 'true';
    }

    return this.candidatesService.findAll(
      page,
      limit,
      search,
      seniority,
      availabilityBool
    );
  }

  //Obtiene un candidato específico
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalles de un candidato',
    description:
      'Retorna toda la información de un candidato específico para mostrar en la pantalla de detalle.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del candidato',
    example: 'clh1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Candidato encontrado',
    type: CandidateResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Candidato no encontrado',
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          message: 'Candidato con ID clh1234567890abcdef no encontrado',
          error: 'Not Found',
        },
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<CandidateResponseDto> {
    this.logger.log(`GET /candidates/${id}`);
    return this.candidatesService.findOne(id);
  }

  //Actualiza información de un candidato
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar candidato',
    description:
      'Actualiza parcialmente los datos de un candidato. Solo se actualizan los campos enviados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del candidato a actualizar',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Candidato actualizado',
    type: CandidateResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateCandidateDto: UpdateCandidateDto
  ): Promise<CandidateResponseDto> {
    this.logger.log(`PATCH /candidates/${id}`);
    return this.candidatesService.update(id, updateCandidateDto);
  }

  //Elimina un candidato
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar candidato',
    description: 'Elimina permanentemente un candidato del sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del candidato a eliminar',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Candidato eliminado exitosamente',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`DELETE /candidates/${id}`);
    await this.candidatesService.remove(id);
  }

  // Estadísticas para dashboards o reportes

  @Get('stats/summary')
  @ApiOperation({
    summary: 'Obtener estadísticas de candidatos',
    description: 'Retorna estadísticas sobre los candidatos en el sistema.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas de candidatos',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total de candidatos' },
        available: { type: 'number', description: 'Candidatos disponibles' },
        unavailable: {
          type: 'number',
          description: 'Candidatos no disponibles',
        },
        bySeniority: {
          type: 'object',
          properties: {
            junior: { type: 'number' },
            senior: { type: 'number' },
          },
        },
        averageExperience: {
          type: 'number',
          description: 'Promedio de años de experiencia',
        },
      },
      example: {
        total: 25,
        available: 18,
        unavailable: 7,
        bySeniority: { junior: 10, senior: 15 },
        averageExperience: 4,
      },
    },
  })
  async getStatistics() {
    this.logger.log('GET /candidates/stats/summary');
    return this.candidatesService.getStatistics();
  }
}
