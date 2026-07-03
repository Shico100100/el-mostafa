import { MetricsController } from './metrics.controller';
import './metrics.interceptor';

describe('MetricsController', () => {
  it('should return metrics', async () => {
    const controller = new MetricsController();
    const result = await controller.getMetrics();
    expect(typeof result).toBe('string');
    expect(result).toContain('http_requests_total');
  });
});
