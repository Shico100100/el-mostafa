import {
  Module,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { FilesLocalController } from './files.controller';
import { FilesLocalService } from './files.service';
import { Attachment } from '../../../entities/attachment.entity';
import { DocumentFilePersistenceModule } from '../../persistence/document/document-persistence.module';
import { RelationalFilePersistenceModule } from '../../persistence/relational/relational-persistence.module';
import { AllConfigType } from '../../../../config/config.type';
import { DatabaseConfig } from '../../../../database/config/database-config.type';
import databaseConfig from '../../../../database/config/database.config';

const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentFilePersistenceModule
  : RelationalFilePersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    TypeOrmModule.forFeature([Attachment]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        return {
          fileFilter: (request, file, callback) => {
            if (
              !file.originalname.match(
                /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx)$/i,
              )
            ) {
              return callback(
                new UnprocessableEntityException({
                  status: HttpStatus.UNPROCESSABLE_ENTITY,
                  errors: { file: `cantUploadFileType` },
                }),
                false,
              );
            }
            callback(null, true);
          },
          storage: diskStorage({
            destination: './files',
            filename: (request, file, callback) => {
              callback(
                null,
                `${randomStringGenerator()}.${file.originalname.split('.').pop()?.toLowerCase()}`,
              );
            },
          }),
          limits: {
            fileSize: configService.get('file.maxFileSize', { infer: true }),
          },
        };
      },
    }),
  ],
  controllers: [FilesLocalController],
  providers: [ConfigModule, ConfigService, FilesLocalService],
  exports: [FilesLocalService],
})
export class FilesLocalModule {}
