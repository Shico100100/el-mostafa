const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DB_USERNAME || process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
  database: process.env.DB_DATABASE || process.env.DATABASE_NAME || 'elmostafa_db',
});

async function main() {
  try {
    const productRes = await pool.query(
      `SELECT id, name, cost_price, type FROM products WHERE id = 233`
    );
    console.log('SEMI-FINISHED PRODUCT:', JSON.stringify(productRes.rows[0], null, 2));

    const moldRes = await pool.query(
      `SELECT id, name, product_id, product_weight FROM molds WHERE name LIKE '%دوشمة%'`
    );
    console.log('\nMOLD:', JSON.stringify(moldRes.rows[0], null, 2));

    if (moldRes.rows.length > 0) {
      const mold = moldRes.rows[0];

      if (mold.product_id) {
        const rawProductRes = await pool.query(
          `SELECT id, name, cost_price, type FROM products WHERE id = $1`,
          [mold.product_id]
        );
        console.log('\nRAW PRODUCT (from mold.product_id):', JSON.stringify(rawProductRes.rows[0], null, 2));

        const rmRes = await pool.query(
          `SELECT id, product_id, last_purchase_price FROM raw_materials WHERE product_id = $1`,
          [mold.product_id]
        );
        console.log('\nRAW MATERIAL (from mold.product_id):', JSON.stringify(rmRes.rows[0], null, 2));
      }

      const prodRes = await pool.query(
        `SELECT id, date, raw_material_id, pieces_produced, machine_id FROM daily_productions WHERE mold_id = $1 ORDER BY date DESC, id DESC LIMIT 1`,
        [mold.id]
      );
      console.log('\nLAST PRODUCTION:', JSON.stringify(prodRes.rows[0], null, 2));

      if (prodRes.rows.length > 0 && prodRes.rows[0].raw_material_id) {
        const rmId = prodRes.rows[0].raw_material_id;
        const rmRes2 = await pool.query(
          `SELECT id, product_id, last_purchase_price FROM raw_materials WHERE id = $1`,
          [rmId]
        );
        console.log('\nRAW MATERIAL (from production):', JSON.stringify(rmRes2.rows[0], null, 2));

        if (rmRes2.rows.length > 0 && rmRes2.rows[0].product_id) {
          const prodId = rmRes2.rows[0].product_id;
          const rpRes = await pool.query(
            `SELECT id, name, cost_price, type FROM products WHERE id = $1`,
            [prodId]
          );
          console.log('\nRAW PRODUCT (from production raw_material):', JSON.stringify(rpRes.rows[0], null, 2));
        }
      }
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
  pool.end();
}

main();
