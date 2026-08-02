const http = require('http');

const BASE = 'http://localhost:3001';
const TOKEN = process.env.BENCH_TOKEN || '';
const SAMPLES = parseInt(process.env.BENCH_SAMPLES || '10', 10);

const endpoints = [
  '/api/v1/inventory/products',
  '/api/v1/inventory/stock',
  '/api/v1/sales/orders',
  '/api/v1/purchases/orders',
  '/api/v1/manufacturing/daily-production',
  '/api/v1/accounting/journal-entries',
  '/api/v1/notifications',
  '/api/v1/dashboard/stats',
];

async function timeRequest(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(url, { headers: { Authorization: `Bearer ${TOKEN}` } }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, time: Date.now() - start, size: body.length });
      });
    }).on('error', (err) => {
      resolve({ status: 0, time: Date.now() - start, error: err.message });
    });
  });
}

async function benchmark() {
  console.log(`Benchmarking ${SAMPLES} samples per endpoint...\n`);
  for (const ep of endpoints) {
    const times = [];
    const statuses = new Set();
    for (let i = 0; i < SAMPLES; i++) {
      const result = await timeRequest(BASE + ep);
      times.push(result.time);
      statuses.add(result.status);
      if (result.error) console.log(`  ${ep}: ERROR - ${result.error}`);
    }
    times.sort((a, b) => a - b);
    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
    const min = times[0];
    const max = times[times.length - 1];
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const statusStr = [...statuses].join('/');
    console.log(`  ${ep}`);
    console.log(`    Status: ${statusStr}  Avg: ${avg}ms  Min: ${min}ms  Max: ${max}ms  P50: ${p50}ms  P95: ${p95}ms`);
  }
}

benchmark().catch(console.error);
