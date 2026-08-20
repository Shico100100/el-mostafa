export async function insertIgnore(
  qr: { query: (sql: string, params: unknown[]) => Promise<unknown> },
  tableName: string,
  values: Record<string, unknown>[],
) {
  if (values.length === 0) return;
  const keys = Object.keys(values[0]).filter(
    (k) => !(typeof values[0][k] === 'object' && values[0][k] !== null),
  );
  const cols = keys.map((k) => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const stmt = `INSERT INTO "${tableName}"(${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  for (const row of values) {
    const params = keys.map((k) => (row[k] !== undefined ? row[k] : null));
    await qr.query(stmt, params);
  }
}
