jest.mock('typeorm', () => {
  class MockBaseEntity {
    static find = jest.fn();
    static findOne = jest.fn();
    static save = jest.fn();
    static remove = jest.fn();
    static create = jest.fn();
  }
  const decorator = () => () => {};
  return {
    BaseEntity: MockBaseEntity,
    AfterLoad: decorator,
    Column: decorator,
    Entity: decorator,
    PrimaryGeneratedColumn: decorator,
    ManyToOne: decorator,
    JoinColumn: decorator,
    CreateDateColumn: decorator,
    UpdateDateColumn: decorator,
    OneToMany: decorator,
    ManyToMany: decorator,
    JoinTable: decorator,
    Index: decorator,
    DataSource: jest.fn().mockImplementation(() => ({
      createQueryRunner: jest.fn(),
      getRepository: jest.fn(),
      entityMetadatas: [],
    })),
  };
});
jest.mock('child_process', () => ({ exec: jest.fn() }));
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

const mockResetSystem = jest.fn();
const mockSeedDemoData = jest.fn();

jest.mock('./system.service', () => ({
  SystemService: jest.fn().mockImplementation(() => ({
    resetSystem: mockResetSystem,
    seedDemoData: mockSeedDemoData,
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { BadRequestException } from '@nestjs/common';

describe('SystemController', () => {
  let controller: SystemController;
  let systemService: { resetSystem: jest.Mock; seedDemoData: jest.Mock };

  beforeEach(async () => {
    mockResetSystem.mockReset();
    mockSeedDemoData.mockReset();

    systemService = {
      resetSystem: mockResetSystem,
      seedDemoData: mockSeedDemoData,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [{ provide: SystemService, useValue: systemService }],
    }).compile();

    controller = module.get<SystemController>(SystemController);
  });

  describe('resetSystem', () => {
    it('should throw BadRequestException when confirm is not true', async () => {
      await expect(controller.resetSystem({})).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.resetSystem({ confirm: false })).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        controller.resetSystem({ confirm: 'yes' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call systemService.resetSystem when confirm is true', async () => {
      const resetResult = { message: 'System reset' };
      mockResetSystem.mockResolvedValue(resetResult);

      const result = await controller.resetSystem({ confirm: true });

      expect(mockResetSystem).toHaveBeenCalled();
      expect(result).toBe(resetResult);
    });
  });

  describe('seedDemoData', () => {
    it('should throw BadRequestException when confirm is not true', async () => {
      await expect(controller.seedDemoData({})).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.seedDemoData({ confirm: false })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call systemService.seedDemoData when confirm is true', async () => {
      const seedResult = { message: 'Demo data seeded' };
      mockSeedDemoData.mockResolvedValue(seedResult);

      const result = await controller.seedDemoData({ confirm: true });

      expect(mockSeedDemoData).toHaveBeenCalled();
      expect(result).toBe(seedResult);
    });
  });
});
