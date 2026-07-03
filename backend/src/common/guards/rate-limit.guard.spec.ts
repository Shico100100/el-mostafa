import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  it('should be an instance of ThrottlerGuard', () => {
    const guard = new RateLimitGuard(
      { throttlers: [] },
      { increment: jest.fn() },
      new Reflector(),
    );
    expect(guard).toBeInstanceOf(ThrottlerGuard);
  });
});
