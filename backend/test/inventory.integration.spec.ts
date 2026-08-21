import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, closeTestApp } from './setup';
import { DataSource } from 'typeorm';

describe('Inventory Flow (Integration)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Reset PostgreSQL sequences to avoid duplicate key violations on seeded data
    const dataSource = app.get(DataSource);
    await dataSource.query(
      `SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1))`,
    );
    await dataSource.query(
      `SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1))`,
    );
    await dataSource.query(
      `SELECT setval(pg_get_serial_sequence('warehouses', 'id'), COALESCE((SELECT MAX(id) FROM warehouses), 1))`,
    );

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/email/login')
      .send({ email: 'admin@admin.com', password: 'admin123' });
    token = loginRes.body.token;
  }, 60000);

  afterAll(async () => {
    await closeTestApp(app);
  });

  // ── Products ──────────────────────────────────────────────

  describe('Products CRUD', () => {
    let createdId: number;

    it('should list products with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory/products?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(0);
      expect(res.body.page).toBe(1);
      if (res.body.data.length > 0) {
        const product = res.body.data[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
      }
    });

    it('should create a product', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Product Integration',
          sku: `TEST-SKU-${Date.now()}`,
          selling_price: 100,
          cost_price: 50,
          type: 'FINISHED',
          unit: 'piece',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Product Integration');
      expect(Number(res.body.selling_price)).toBe(100);
      expect(Number(res.body.cost_price)).toBe(50);
      expect(res.body.type).toBe('FINISHED');
      createdId = res.body.id;
    });

    it('should read the created product', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inventory/products/${createdId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdId);
      expect(res.body.name).toBe('Test Product Integration');
    });

    it('should update the product', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/inventory/products/${createdId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Test Product', selling_price: 200 });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdId);
      expect(res.body.name).toBe('Updated Test Product');
      expect(Number(res.body.selling_price)).toBe(200);
    });

    it('should delete the product', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/inventory/products/${createdId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ── Categories ────────────────────────────────────────────

  describe('Categories CRUD', () => {
    let createdId: number;

    it('should list categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should create a category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Test Category ${Date.now()}`,
          description: 'A test category',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toMatch(/^Test Category/);
      expect(res.body.description).toBe('A test category');
      createdId = res.body.id;
    });

    it('should contain the created category in list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const found = res.body.find((c: any) => c.id === createdId);
      expect(found).toBeDefined();
      expect(found.name).toMatch(/^Test Category/);
    });

    it('should update the category', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/inventory/categories/${createdId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Updated Category ${Date.now()}` });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdId);
      expect(res.body.name).toMatch(/^Updated Category/);
    });

    it('should delete the category', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/inventory/categories/${createdId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify deletion by checking it's gone from the list
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/inventory/categories')
        .set('Authorization', `Bearer ${token}`);
      const found = listRes.body.find((c: any) => c.id === createdId);
      expect(found).toBeUndefined();
    });
  });

  // ── Warehouses ────────────────────────────────────────────

  describe('Warehouses CRUD', () => {
    let createdId: number;

    it('should list warehouses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory/warehouses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('name');
      }
    });

    it('should create a warehouse', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory/warehouses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Test Warehouse ${Date.now()}`,
          location: 'Test Location',
          is_active: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toMatch(/^Test Warehouse/);
      expect(res.body.location).toBe('Test Location');
      expect(res.body.is_active).toBe(true);
      createdId = res.body.id;
    });

    it('should read the created warehouse', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inventory/warehouses/${createdId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdId);
      expect(res.body.name).toMatch(/^Test Warehouse/);
    });

    it('should update the warehouse', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/inventory/warehouses/${createdId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Updated Warehouse ${Date.now()}`, is_active: false });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdId);
      expect(res.body.name).toMatch(/^Updated Warehouse/);
      expect(res.body.is_active).toBe(false);
    });

    it('should delete the warehouse', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/inventory/warehouses/${createdId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
