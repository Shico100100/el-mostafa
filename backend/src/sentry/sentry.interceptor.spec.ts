import { SentryInterceptor } from './sentry.interceptor';

describe('SentryInterceptor', () => {
  it('should be defined', () => {
    const interceptor = new SentryInterceptor();
    expect(interceptor).toBeDefined();
  });
});
