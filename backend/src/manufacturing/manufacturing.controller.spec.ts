import { Test, TestingModule } from '@nestjs/testing';
import { ManufacturingController } from './manufacturing.controller';
import { ManufacturingService } from './manufacturing.service';
import { MRPService } from './mrp.service';

describe('ManufacturingController', () => {
  let controller: ManufacturingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManufacturingController],
      providers: [
        {
          provide: ManufacturingService,
          useValue: {},
        },
        {
          provide: MRPService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ManufacturingController>(ManufacturingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
