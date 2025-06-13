import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de prefijo global
  app.setGlobalPrefix('api');

  // Habilitar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || [
      'http://localhost:4200',
      'https://*.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configuración global de validaciones
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Gestión de Candidatos')
    .setDescription(
      'API REST para la gestión de candidatos y procesamiento de archivos Excel. ' +
        'Permite crear, leer, actualizar y eliminar candidatos, así como importar datos desde archivos Excel.'
    )
    .setVersion('1.0.0')
    .addTag('Candidatos', 'Operaciones CRUD para gestión de candidatos')
    .addServer('http://localhost:3000', 'Desarrollo Local')
    .addServer('http://localhost:3000', 'Docker Desarrollo')
    .setContact(
      'Equipo de Desarrollo',
      'https://github.com/nandoll/gestion-talentos',
      'soporte@gestion-talentos.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'API Docs - Gestión de Talentos',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
    `,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Gestion de Talentos- en: http://localhost:${port}/`);
  Logger.log(`📚 Documentacion: http://localhost:${port}/api/docs`);
}

bootstrap();
