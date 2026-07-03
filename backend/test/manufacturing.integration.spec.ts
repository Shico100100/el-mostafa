import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, closeTestApp } from './setup';

describe('Manufacturing Flow (Integration)', () => {
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

  it('should list raw materials', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/manufacturing/raw-materials')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should list accessories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/manufacturing/accessories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should list BOMs', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/manufacturing/boms')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('should list machines', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/manufacturing/machines')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
