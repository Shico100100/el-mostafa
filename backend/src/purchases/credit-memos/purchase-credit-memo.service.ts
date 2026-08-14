import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseCreditMemo } from '../entities/purchase-credit-memo.entity';
import { PurchaseCreditMemoItem } from '../entities/purchase-credit-memo-item.entity';

@Injectable()
export class PurchaseCreditMemoService {
  constructor(
    @InjectRepository(PurchaseCreditMemo)
    private cmRepo: Repository<PurchaseCreditMemo>,
    @InjectRepository(PurchaseCreditMemoItem)
    private cmItemRepo: Repository<PurchaseCreditMemoItem>,
  ) {}

  async findAll(): Promise<PurchaseCreditMemo[]> {
    return this.cmRepo.find({
      relations: ['supplier', 'items', 'items.product'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<PurchaseCreditMemo> {
    const cm = await this.cmRepo.findOne({
      where: { id },
      relations: ['supplier', 'items', 'items.product'],
    });
    if (!cm)
      throw new NotFoundException(`Purchase credit memo #${id} not found`);
    return cm;
  }

  async create(data: {
    supplier_id: number;
    total_amount: number;
    date: Date;
    reference?: string;
    reason?: string;
    items: {
      product_id: number;
      quantity: number;
      unit_price: number;
      total: number;
    }[];
  }): Promise<PurchaseCreditMemo> {
    const cm = this.cmRepo.create({
      supplier_id: data.supplier_id,
      total_amount: data.total_amount,
      date: data.date,
      reference: data.reference,
      reason: data.reason,
    });
    const saved = await this.cmRepo.save(cm);

    for (const item of data.items) {
      await this.cmItemRepo.save(
        this.cmItemRepo.create({ credit_memo_id: saved.id, ...item }),
      );
    }
    return this.findOne(saved.id);
  }

  async updateStatus(id: number, status: string): Promise<PurchaseCreditMemo> {
    const cm = await this.findOne(id);
    cm.status = status;
    return this.cmRepo.save(cm);
  }
}
