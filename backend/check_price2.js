const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'elmostafa_db'
});

async function main() {
  try {
    // Find table names
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%product%' OR table_name LIKE '%production%' OR table_name LIKE '%raw%'"
    );
    console.log('TABLES:', tables.rows.map(r => r.table_name));

    // Find the production table
    const prodTables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%production%'"
    );
    console.log('\nPRODUCTION TABLES:', prodTables.rows.map(r => r.table_name));

    if (prodTables.rows.length > 0) {
      const prodTable = prodTables.rows[0].table_name;
      console.log('\nUsing table:', prodTable);

      // Get column names
      const cols = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
        [prodTable]
      );
      console.log('COLUMNS:', cols.rows.map(r => r.column_name));

      // Find production for mold 91
      const prod = await pool.query(
        `SELECT * FROM "${prodTable}" WHERE mold_id = 91 ORDER BY date DESC, id DESC LIMIT 1`
      );
      console.log('\nPRODUCTION:', JSON.stringify(prod.rows[0], null, 2));
    }

  } catch (e) {
    console.error('ERROR:', e.message);
  }
  pool.end();
}

main();
