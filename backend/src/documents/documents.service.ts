import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private uploadDir = path.join(__dirname, '..', '..', 'uploads');

  constructor(
    @InjectRepository(Document)
    private repo: Repository<Document>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Express.Multer.File,
    entityType?: string,
    entityId?: number,
  ) {
    const doc = this.repo.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      entityType,
      entityId,
    });
    return this.repo.save(doc);
  }

  async findOne(id: number) {
    const doc = await this.repo.findOneBy({ id });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findByEntity(entityType: string, entityId: number) {
    return this.repo.find({ where: { entityType, entityId } });
  }

  async delete(id: number) {
    const doc = await this.findOne(id);
    const filePath = path.join(this.uploadDir, doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await this.repo.remove(doc);
  }
}
