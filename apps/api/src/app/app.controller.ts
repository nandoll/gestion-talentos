import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController() // No mostrar en Swagger
@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'API de Gestión de Candidatos',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/api/health',
    };
  }
}
