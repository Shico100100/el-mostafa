import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Container } from '../entities/container.entity';

@Injectable()
export class ContainerService {
  constructor(
    @InjectRepository(Container)
    private containerRepo: Repository<Container>,
  ) {}

  async getContainers() {
    return this.containerRepo.find({ order: { name: 'ASC' } });
  }

  async getContainer(id: number) {
    return this.containerRepo.findOne({ where: { id } });
  }

  async createContainer(data: Partial<Container>) {
    const container = this.containerRepo.create(data);
    const saved = await this.containerRepo.save(container);
    const cbm =
      (Number(saved.length_cm) *
        Number(saved.width_cm) *
        Number(saved.height_cm)) /
      1_000_000;
    saved.max_cbm = cbm;
    return this.containerRepo.save(saved);
  }

  async updateContainer(id: number, data: Partial<Container>) {
    await this.containerRepo.update(id, data);
    const container = await this.containerRepo.findOne({ where: { id } });
    if (container) {
      const cbm =
        (Number(container.length_cm) *
          Number(container.width_cm) *
          Number(container.height_cm)) /
        1_000_000;
      container.max_cbm = cbm;
      await this.containerRepo.save(container);
    }
    return container;
  }

  async deleteContainer(id: number) {
    return this.containerRepo.delete(id);
  }

  async calculateCBM(
    lengthCm: number,
    widthCm: number,
    heightCm: number,
    cartonsCount: number,
  ) {
    const cbm = (lengthCm * widthCm * heightCm * cartonsCount) / 1_000_000;
    const containers = await this.getContainers();
    const containerSuggestions = containers
      .filter((c) => c.is_active)
      .map((c) => ({
        id: c.id,
        name: c.name,
        max_cbm: Number(c.max_cbm),
        max_weight_kg: Number(c.max_weight_kg),
        fits: cbm <= Number(c.max_cbm) && cbm > 0,
        utilization_pct:
          cbm > 0 ? Math.min(100, (cbm / Number(c.max_cbm)) * 100) : 0,
        remaining_cbm: Math.max(0, Number(c.max_cbm) - cbm),
      }))
      .sort((a, b) => b.utilization_pct - a.utilization_pct);

    return {
      carton_volume_cm3: lengthCm * widthCm * heightCm,
      total_cbm: cbm,
      carton_dimensions: {
        length_cm: lengthCm,
        width_cm: widthCm,
        height_cm: heightCm,
      },
      cartons_count: cartonsCount,
      container_suggestions: containerSuggestions,
    };
  }
}
