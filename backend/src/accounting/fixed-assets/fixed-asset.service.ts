import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixedAsset, DepreciationMethod, AssetStatus } from './entities/fixed-asset.entity';
import { DepreciationEntry } from './entities/depreciation-entry.entity';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';

@Injectable()
export class FixedAssetService {
  constructor(
    @InjectRepository(FixedAsset) private assetRepo: Repository<FixedAsset>,
    @InjectRepository(DepreciationEntry) private deprRepo: Repository<DepreciationEntry>,
  ) {}

  async findAll(): Promise<FixedAsset[]> {
    return this.assetRepo.find({ order: { asset_code: 'ASC' } });
  }

  async findOne(id: number): Promise<FixedAsset> {
    const asset = await this.assetRepo.findOne({ where: { id }, relations: ['depreciation_entries'] });
    if (!asset) throw new NotFoundException(`Fixed asset #${id} not found`);
    return asset;
  }

  async create(dto: CreateFixedAssetDto): Promise<FixedAsset> {
    const asset = this.assetRepo.create({
      ...dto,
      purchase_date: new Date(dto.purchase_date),
      book_value: dto.purchase_cost,
      depreciation_method: dto.depreciation_method || DepreciationMethod.STRAIGHT_LINE,
    });
    return this.assetRepo.save(asset);
  }

  async update(id: number, dto: Partial<CreateFixedAssetDto>): Promise<FixedAsset> {
    const asset = await this.findOne(id);
    Object.assign(asset, dto);
    return this.assetRepo.save(asset);
  }

  async depreciate(id: number, period: string): Promise<DepreciationEntry> {
    const asset = await this.findOne(id);
    if (asset.status !== AssetStatus.ACTIVE) throw new BadRequestException('الأصل غير نشط');
    if (asset.book_value <= asset.salvage_value) throw new BadRequestException('الأصل محول بالكامل');

    const [year, month] = period.split('-').map(Number);
    const existing = await this.deprRepo.findOne({ where: { asset_id: id, period } });
    if (existing) throw new BadRequestException(`الإهلاك مسجل بالفعل للفترة ${period}`);

    let deprAmount = 0;
    if (asset.depreciation_method === DepreciationMethod.STRAIGHT_LINE) {
      deprAmount = (Number(asset.purchase_cost) - Number(asset.salvage_value)) / asset.useful_life_years / 12;
    } else {
      const rate = 2 / asset.useful_life_years;
      deprAmount = Number(asset.book_value) * rate / 12;
    }

    deprAmount = Math.min(deprAmount, Number(asset.book_value) - Number(asset.salvage_value));
    deprAmount = Math.round(deprAmount * 100) / 100;

    asset.accumulated_depreciation = Number(asset.accumulated_depreciation) + deprAmount;
    asset.book_value = Number(asset.book_value) - deprAmount;
    await this.assetRepo.save(asset);

    return this.deprRepo.save(this.deprRepo.create({
      asset_id: id,
      period,
      amount: deprAmount,
      accumulated_after: asset.accumulated_depreciation,
    }));
  }

  async dispose(id: number, disposalDate: string, disposalAmount: number): Promise<FixedAsset> {
    const asset = await this.findOne(id);
    asset.status = AssetStatus.DISPOSED;
    asset.disposal_date = new Date(disposalDate);
    asset.disposal_amount = disposalAmount;
    return this.assetRepo.save(asset);
  }

  async getSchedule(id: number): Promise<DepreciationEntry[]> {
    return this.deprRepo.find({ where: { asset_id: id }, order: { period: 'ASC' } });
  }
}
