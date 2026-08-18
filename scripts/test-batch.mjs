const fs = require('fs');

const path = 'c:/Users/Ali Raza/Desktop/Fraud-Transaction-Detector-Frontend-main/sample-transactions.csv';
const csv = fs.readFileSync(path, 'utf8');
const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const header = lines[0].split(',');
const NUM = new Set(['step','amount','oldbalanceOrg','newbalanceOrig','oldbalanceDest','newbalanceDest']);
const txns = lines.slice(1).map(line => {
  const cells = line.split(',');
  const o = {};
  header.forEach((h, i) => { o[h] = NUM.has(h) ? Number(cells[i]) : cells[i]; });
  return o;
});

async function findPort() {
  for (const p of [3000, 3001, 3002, 3003]) {
    try { await fetch(`http://localhost:${p}/api/health`); return p; } catch {}
  }
  return null;
}

(async () => {
  const port = await findPort();
  if (!port) { console.log('No dev server found on 3000-3003. Start it with: npm run dev'); return; }
  console.log('Dev server port:', port, '| transactions parsed:', txns.length);

  const h = await fetch(`http://localhost:${port}/api/health`);
  console.log('\n[HEALTH]', h.status, (await h.text()).trim());

  const res = await fetch(`http://localhost:${port}/api/predict/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions: txns }),
  });
  console.log('\n[BATCH] HTTP', res.status);
  const data = await res.json();
  if (!res.ok) { console.log('Error:', JSON.stringify(data)); return; }

  const preds = data.predictions;
  const anomalies = preds.filter(p => p.is_anomaly).length;
  console.log(`count=${data.count}  anomalies=${anomalies}  rate=${(anomalies / data.count * 100).toFixed(1)}%\n`);
  console.log('  #  type      amount        ensemble  seg  verdict   if/lof/ae');
  preds.forEach((p, i) => {
    const t = txns[i];
    const row = [
      String(i + 1).padStart(3),
      (t.type || '').padEnd(9),
      String(t.amount).padStart(12),
      (p.ensemble_score * 100).toFixed(1).padStart(7) + '%',
      String(p.cluster).padStart(4),
      (p.is_anomaly ? 'ANOMALY' : 'normal ').padStart(8),
      ` ${p.if_score.toFixed(3)}/${p.lof_score.toFixed(3)}/${p.ae_score.toFixed(4)}`,
    ].join('  ');
    console.log(row);
  });
})();
