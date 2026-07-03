const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'elmostafa_db'
});

async function main() {
  try {
    // Semi-finished product 233
    const p = await pool.query('SELECT id, name, cost_price, type FROM products WHERE id = 233');
    console.log('SEMI-FINISHED PRODUCT:', JSON.stringify(p.rows[0], null, 2));

    // Get mold name from product name (remove prefix)
    const productName = p.rows[0].name;
    const moldName = productName.replace('بلاستيك ', '');
    console.log('\nLooking for mold:', moldName);

    const m = await pool.query('SELECT id, name, product_id, product_weight FROM molds WHERE name = $1', [moldName]);
    console.log('MOLD:', JSON.stringify(m.rows[0], null, 2));

    if (m.rows.length > 0) {
      const mold = m.rows[0];

      // Check mold.product_id
      if (mold.product_id) {
        const rp = await pool.query('SELECT id, name, cost_price, type FROM products WHERE id = $1', [mold.product_id]);
        console.log('\nRAW PRODUCT (from mold.product_id):', JSON.stringify(rp.rows[0], null, 2));

        const rm = await pool.query('SELECT id, product_id, last_purchase_price FROM raw_materials WHERE product_id = $1', [mold.product_id]);
        console.log('RAW MATERIAL (from mold.product_id):', JSON.stringify(rm.rows[0], null, 2));
      } else {
        console.log('\nmold.product_id is NULL');
      }

      // Get last production for this mold
      const prod = await pool.query(
        'SELECT id, date, raw_material_id, pieces_produced, machine_id FROM daily_productions WHERE mold_id = $1 ORDER BY date DESC, id DESC LIMIT 1',
        [mold.id]
      );
      console.log('\nLAST PRODUCTION:', JSON.stringify(prod.rows[0], null, 2));

      if (prod.rows.length > 0 && prod.rows[0].raw_material_id) {
        const rm2 = await pool.query('SELECT id, product_id, last_purchase_price FROM raw_materials WHERE id = $1', [prod.rows[0].raw_material_id]);
        console.log('\nRAW MATERIAL (from production):', JSON.stringify(rm2.rows[0], null, 2));

        if (rm2.rows.length > 0 && rm2.rows[0].product_id) {
          const rp2 = await pool.query('SELECT id, name, cost_price, type FROM products WHERE id = $1', [rm2.rows[0].product_id]);
          console.log('RAW PRODUCT (from production):', JSON.stringify(rp2.rows[0], null, 2));
        }
      }
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  pool.end();
}

main();
