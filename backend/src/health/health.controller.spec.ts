import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let dbIndicator: TypeOrmHealthIndicator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest
              .fn()
              .mockImplementation((indicators: (() => Promise<unknown>)[]) =>
                Promise.all(indicators.map((fn) => fn())).then(() => ({
                  status: 'ok',
                })),
              ),
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: jest
              .fn()
              .mockResolvedValue({ database: { status: 'up' } }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    dbIndicator = module.get<TypeOrmHealthIndicator>(TypeOrmHealthIndicator);
  });

  it('should return liveness', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
  });

  it('should return readiness and invoke pingCheck', async () => {
    const result = await controller.readiness();
    expect(result.status).toBe('ok');
    expect(dbIndicator.pingCheck).toHaveBeenCalledWith('database');
  });
});
