import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../../../entities/attachment.entity';

import { FileRepository } from '../../persistence/file.repository';
import { AllConfigType } from '../../../../config/config.type';
import { FileType } from '../../../domain/file';

@Injectable()
export class FilesLocalService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly fileRepository: FileRepository,
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
  ) {}

  async create(file: Express.Multer.File): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    return {
      file: await this.fileRepository.create({
        path: `/${this.configService.get('app.apiPrefix', {
          infer: true,
        })}/v1/${file.path}`,
      }),
    };
  }

  async linkToTransaction(
    path: string,
    filename: string,
    mimetype: string,
    relatedType: string,
    relatedId: number,
  ) {
    const attachment = this.attachmentRepo.create({
      path,
      filename,
      mimetype,
      related_type: relatedType,
      related_id: relatedId,
    });
    return this.attachmentRepo.save(attachment);
  }

  async getAttachments(relatedType: string, relatedId: number) {
    return this.attachmentRepo.find({
      where: { related_type: relatedType, related_id: relatedId },
      order: { created_at: 'DESC' },
    });
  }
}
