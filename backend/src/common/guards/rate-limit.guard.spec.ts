import { ExecutionContext } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let mockThrottlerStorage: {
    increment: jest.Mock;
    decrement: jest.Mock;
    resetKey: jest.Mock;
  };

  beforeEach(async () => {
    mockThrottlerStorage = {
      increment: jest.fn(),
      decrement: jest.fn(),
      resetKey: jest.fn(),
    };

    guard = new RateLimitGuard(
      { throttlers: [{ ttl: 60000, limit: 2 }] },
      mockThrottlerStorage,
      new Reflector(),
    );

    await guard.onModuleInit();
  });

  it('should extend ThrottlerGuard', () => {
    expect(guard).toBeInstanceOf(ThrottlerGuard);
  });

  describe('canActivate', () => {
    const createMockContext = (ip = '127.0.0.1'): ExecutionContext => {
      const mockRes = { header: jest.fn() };
      return {
        switchToHttp: () => ({
          getRequest: () => ({
            ip,
            headers: {},
            route: { path: '/test' },
          }),
          getResponse: () => mockRes,
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;
    };

    it('should allow request within rate limit', async () => {
      mockThrottlerStorage.increment.mockResolvedValue({
        totalHits: 1,
        timeToExpire: 60000,
        isBlocked: false,
      });

      const result = await guard.canActivate(createMockContext());

      expect(result).toBe(true);
      expect(mockThrottlerStorage.increment).toHaveBeenCalled();
    });

    it('should throw ThrottlerException when rate limit exceeded', async () => {
      mockThrottlerStorage.increment.mockResolvedValue({
        totalHits: 3,
        timeToExpire: 60000,
        isBlocked: true,
        timeToBlockExpire: 60000,
      });

      await expect(guard.canActivate(createMockContext())).rejects.toThrow(
        ThrottlerException,
      );
    });

    it('should allow requests from different IPs independently', async () => {
      const ip1Context = createMockContext('192.168.1.1');
      const ip2Context = createMockContext('192.168.1.2');

      mockThrottlerStorage.increment
        .mockResolvedValueOnce({
          totalHits: 1,
          timeToExpire: 60000,
          isBlocked: false,
        })
        .mockResolvedValueOnce({
          totalHits: 1,
          timeToExpire: 60000,
          isBlocked: false,
        });

      const result1 = await guard.canActivate(ip1Context);
      const result2 = await guard.canActivate(ip2Context);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockThrottlerStorage.increment).toHaveBeenCalledTimes(2);
    });
  });
});
