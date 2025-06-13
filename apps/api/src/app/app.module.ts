import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '../prisma/prisma.module';
import { CandidatesModule } from '../modules/candidates/candidates.module';
import configuration from '../config/configuration';

@Module({
  imports: [
    // Configuración global con validación
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
    }),

    // Rate limiting para protección contra abuso
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('throttle.ttl', 60000), // 1 minuto por defecto
          limit: config.get('throttle.limit', 100), // 100 peticiones por defecto
        },
      ],
    }),

    // Logger estructurado con Pino
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDevelopment = config.get('NODE_ENV') === 'development';

        return {
          pinoHttp: {
            name: 'gestion-talentos-api',
            level: isDevelopment ? 'debug' : 'info',
            transport: isDevelopment
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    levelFirst: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss',
                  },
                }
              : undefined,
            // Redactar información sensible
            redact: ['req.headers.authorization', 'req.headers.cookie'],
            // Serializers personalizados
            serializers: {
              req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                query: req.query,
                params: req.params,
                headers: {
                  'user-agent': req.headers['user-agent'],
                  host: req.headers.host,
                },
              }),
              res: (res) => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
    }),

    PrismaModule,
    CandidatesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
