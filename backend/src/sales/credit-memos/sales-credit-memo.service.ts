import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesCreditMemo } from '../entities/sales-credit-memo.entity';
import { SalesCreditMemoItem } from '../entities/sales-credit-memo-item.entity';

@Injectable()
export class SalesCreditMemoService {
  constructor(
    @InjectRepository(SalesCreditMemo) private cmRepo: Repository<SalesCreditMemo>,
    @InjectRepository(SalesCreditMemoItem) private cmItemRepo: Repository<SalesCreditMemoItem>,
  ) {}

  async findAll(): Promise<SalesCreditMemo[]> {
    return this.cmRepo.find({ relations: ['customer', 'items', 'items.product'], order: { created_at: 'DESC' } });
  }

  async findOne(id: number): Promise<SalesCreditMemo> {
    const cm = await this.cmRepo.findOne({ where: { id }, relations: ['customer', 'items', 'items.product'] });
    if (!cm) throw new NotFoundException(`Sales credit memo #${id} not found`);
    return cm;
  }

  async create(data: { customer_id: number; total_amount: number; date: Date; reference?: string; reason?: string; items: { product_id: number; quantity: number; unit_price: number; total: number }[] }): Promise<SalesCreditMemo> {
    const cm = this.cmRepo.create({
      customer_id: data.customer_id,
      total_amount: data.total_amount,
      date: data.date,
      reference: data.reference,
      reason: data.reason,
    });
    const saved = await this.cmRepo.save(cm);

    for (const item of data.items) {
      await this.cmItemRepo.save(this.cmItemRepo.create({ credit_memo_id: saved.id, ...item }));
    }
    return this.findOne(saved.id);
  }

  async updateStatus(id: number, status: string): Promise<SalesCreditMemo> {
    const cm = await this.findOne(id);
    cm.status = status;
    return this.cmRepo.save(cm);
  }
}
