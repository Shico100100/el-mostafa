import { CacheService } from './cache.service';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  quit: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(() => mockRedis),
}));

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CacheService();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should set and get cache', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ value: 123 }));

    await service.set('test-key', { value: 123 }, 60);
    const result = await service.get('test-key');

    expect(mockRedis.set).toHaveBeenCalledWith('test-key', JSON.stringify({ value: 123 }), 'EX', 60);
    expect(result).toEqual({ value: 123 });
  });

  it('should return null for non-existent key', async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await service.get('non-existent');

    expect(result).toBeNull();
  });

  it('should delete cache', async () => {
    mockRedis.get.mockResolvedValue(null);

    await service.set('test-key', { value: 123 }, 60);
    await service.del('test-key');
    const result = await service.get('test-key');

    expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    expect(result).toBeNull();
  });
});
