import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  it('should call next()', () => {
    const middleware = new RequestLoggerMiddleware();
    const req = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn(),
    } as any;
    const res = { statusCode: 200, on: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should register finish event listener on response', () => {
    const middleware = new RequestLoggerMiddleware();
    const req = {
      method: 'POST',
      originalUrl: '/api/users',
      ip: '10.0.0.1',
      get: jest.fn(),
    } as any;
    const res = { statusCode: 201, on: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });
});
