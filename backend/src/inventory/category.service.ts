import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async getAllCategories() {
    return this.categoryRepo.find({ relations: ['parent'] });
  }

  async createCategory(data: Partial<Category>) {
    return this.categoryRepo.save(this.categoryRepo.create(data));
  }

  async updateCategory(id: number, data: Partial<Category>) {
    await this.categoryRepo.update(id, data);
    return this.categoryRepo.findOne({ where: { id } });
  }

  async deleteCategory(id: number) {
    return this.categoryRepo.delete(id);
  }
}
