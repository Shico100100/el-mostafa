const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    host: '127.0.0.1', port: 5434,
    database: 'elmostafa_db', user: 'postgres', password: 'postgres'
  });
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO "user" (id, email, password, provider, "firstName", "lastName", "roleId", "statusId")
     VALUES (1, 'admin@admin.com', $1, 'email', 'Admin', 'User', 1, 1) ON CONFLICT DO NOTHING`,
    [hash]
  );
  await pool.query(
    `INSERT INTO "user" (id, email, password, provider, "firstName", "lastName", "roleId", "statusId")
     VALUES (2, 'admin@example.com', $1, 'email', 'Admin', 'User', 1, 1) ON CONFLICT DO NOTHING`,
    [hash]
  );
  await pool.query(
    `INSERT INTO "user" (id, email, password, provider, "firstName", "lastName", "roleId", "statusId")
     VALUES (3, 'manager@admin.com', $1, 'email', 'Manager', 'User', 3, 1) ON CONFLICT DO NOTHING`,
    [hash]
  );
  await pool.query(
    `INSERT INTO "user" (id, email, password, provider, "firstName", "lastName", "roleId", "statusId")
     VALUES (4, 'worker@admin.com', $1, 'email', 'Worker', 'User', 6, 1) ON CONFLICT DO NOTHING`,
    [hash]
  );
  await pool.query(
    `INSERT INTO "user" (id, email, password, provider, "firstName", "lastName", "roleId", "statusId")
     VALUES (5, 'viewer@admin.com', $1, 'email', 'Viewer', 'User', 7, 1) ON CONFLICT DO NOTHING`,
    [hash]
  );
  console.log('Users seeded');
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
