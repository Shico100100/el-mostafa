const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'elmostafa_db'
});

async function main() {
  try {
    const cols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_production'"
    );
    console.log('daily_production COLUMNS:', cols.rows.map(r => r.column_name));

    const prod = await pool.query(
      'SELECT * FROM daily_production WHERE mold_id = 91 ORDER BY id DESC LIMIT 1'
    );
    console.log('\nPRODUCTION:', JSON.stringify(prod.rows[0], null, 2));

    // Also find all raw materials
    const rms = await pool.query('SELECT id, product_id, last_purchase_price FROM raw_materials WHERE last_purchase_price > 0 LIMIT 5');
    console.log('\nRAW MATERIALS WITH PRICE:', JSON.stringify(rms.rows, null, 2));

    // Look for raw materials with product name related to this mold
    const rmProducts = await pool.query(
      "SELECT rm.id, rm.product_id, rm.last_purchase_price, p.name, p.cost_price FROM raw_materials rm JOIN products p ON p.id = rm.product_id WHERE p.name LIKE '%دوش%' OR p.name LIKE '%بلاستيك%' LIMIT 10"
    );
    console.log('\nRAW MATERIALS WITH NAMES:', JSON.stringify(rmProducts.rows, null, 2));

    // Check the semi-finished product's production history
    const semiProds = await pool.query(
      "SELECT dp.id, dp.date, dp.mold_id, dp.raw_material_id, dp.pieces_produced, dp.total_production_kg, dp.overhead_cost FROM daily_production dp WHERE dp.mold_id = 91 ORDER BY dp.id DESC LIMIT 5"
    );
    console.log('\nALL PRODUCTIONS FOR MOLD 91:', JSON.stringify(semiProds.rows, null, 2));

    if (semiProds.rows.length > 0 && semiProds.rows[0].raw_material_id) {
      const rmId = semiProds.rows[0].raw_material_id;
      const rm2 = await pool.query('SELECT * FROM raw_materials WHERE id = $1', [rmId]);
      console.log('\nRAW MATERIAL USED:', JSON.stringify(rm2.rows[0], null, 2));
      if (rm2.rows.length > 0 && rm2.rows[0].product_id) {
        const rp = await pool.query('SELECT * FROM products WHERE id = $1', [rm2.rows[0].product_id]);
        console.log('RAW PRODUCT:', JSON.stringify(rp.rows[0], null, 2));
      }
    }

  } catch (e) {
    console.error('ERROR:', e.message);
  }
  pool.end();
}

main();
