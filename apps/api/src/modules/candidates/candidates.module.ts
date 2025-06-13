import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { ExcelProcessorService } from './services/excel-processor.service';
import { CandidateValidatorService } from './services/candidate-validator.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
        files: 1, // Solo un archivo a la vez
      },
      fileFilter: (req, file, callback) => {
        // Validación estricta del tipo de archivo
        const allowedMimes = [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        const allowedExtensions = ['.xls', '.xlsx'];

        const fileExtension = file.originalname
          .toLowerCase()
          .substring(file.originalname.lastIndexOf('.'));

        if (
          allowedMimes.includes(file.mimetype) ||
          allowedExtensions.includes(fileExtension)
        ) {
          callback(null, true);
        } else {
          callback(
            new Error('Solo se permiten archivos Excel (.xls, .xlsx)'),
            false
          );
        }
      },
    }),
  ],
  controllers: [CandidatesController],
  providers: [
    CandidatesService,
    ExcelProcessorService,
    CandidateValidatorService,
  ],
  exports: [CandidatesService],
})
export class CandidatesModule {}
