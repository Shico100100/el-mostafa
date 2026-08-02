import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let repo: jest.Mocked<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repo = module.get(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save an audit entry', async () => {
      const data = { entity: 'User', entityId: '1', action: 'CREATE', userId: 5 };
      const entry = { id: 1, ...data };
      repo.create.mockReturnValue(entry);
      repo.save.mockResolvedValue(entry);

      const result = await service.log(data);

      expect(repo.create).toHaveBeenCalledWith(data);
      expect(repo.save).toHaveBeenCalledWith(entry);
      expect(result).toEqual(entry);
    });
  });

  describe('findAll', () => {
    it('should return recent entries with default limit 100', async () => {
      repo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const result = await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' }, take: 100 });
      expect(result).toHaveLength(2);
    });

    it('should respect custom limit', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll(5);
      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' }, take: 5 });
    });
  });

  describe('findByEntity', () => {
    it('should find logs by entity type and id', async () => {
      const logs = [{ id: 1, entity: 'User', entityId: '42' }];
      repo.find.mockResolvedValue(logs);
      const result = await service.findByEntity('User', 42);
      expect(repo.find).toHaveBeenCalledWith({ where: { entityId: '42' }, order: { createdAt: 'DESC' } });
      expect(result).toEqual(logs);
    });
  });
});
