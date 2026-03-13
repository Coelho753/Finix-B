function average(numbers) {
  if (!numbers.length) return 0;
  return Number((numbers.reduce((acc, n) => acc + n, 0) / numbers.length).toFixed(2));
}

function mode(numbers) {
  if (!numbers.length) return [];
  const frequency = new Map();
  for (const n of numbers) {
    frequency.set(n, (frequency.get(n) || 0) + 1);
  }
  const max = Math.max(...frequency.values());
  return [...frequency.entries()]
    .filter(([, count]) => count === max)
    .map(([value]) => Number(value));
}

function buildMonthlyChart(loans) {
  const buckets = {};
  for (const loan of loans) {
    const date = new Date(loan.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = (buckets[key] || 0) + loan.principal;
  }

  const labels = Object.keys(buckets).sort();
  const values = labels.map((label) => Number(buckets[label].toFixed(2)));
  return { labels, values };
}

module.exports = { average, mode, buildMonthlyChart };
