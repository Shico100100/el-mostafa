import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote, QuoteStatus } from '../entities/quote.entity';
import { QuoteItem } from '../entities/quote-item.entity';

@Injectable()
export class QuoteService {
  constructor(
    @InjectRepository(Quote)
    private quoteRepo: Repository<Quote>,
    @InjectRepository(QuoteItem)
    private quoteItemRepo: Repository<QuoteItem>,
  ) {}

  async getAllQuotes() {
    return this.quoteRepo.find({
      relations: ['customer', 'items', 'items.product'],
    });
  }

  async getQuote(id: number) {
    return this.quoteRepo.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });
  }

  async updateQuoteStatus(id: number, status: QuoteStatus) {
    await this.quoteRepo.update(id, { status });
    return this.quoteRepo.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
  }

  async deleteQuote(id: number) {
    return this.quoteRepo.delete(id);
  }
}
