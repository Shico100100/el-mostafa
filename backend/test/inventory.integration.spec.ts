import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, closeTestApp } from './setup';

describe('Inventory Flow (Integration)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/email/login')
      .send({ email: 'admin@admin.com', password: 'admin123' });
    token = loginRes.body.token;
  }, 30000);

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('should list products with pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory/products?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.total).toBeGreaterThanOrEqual(0);
    expect(res.body.page).toBe(1);
  });

  it('should list categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should list warehouses', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory/warehouses')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
