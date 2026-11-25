export function normalizeOrder(order = {}) {
  const normalized = {};
  normalized.id = order.id || 'unknown';
  normalized.customer = order.customer || 'anonymous';
  normalized.amount = Number(order.amount) || 0;
  normalized.status = order.status || 'unknown';
  normalized.retries = Number(order.retries) || 0;
  normalized.ageHours = Number(order.ageHours) || 0;
  return normalized;
}

export function summarizeAmounts(orders = []) {
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const order of orders) {
    const amount = Number(order.amount) || 0;
    sum += amount;
    if (amount < min) {
      min = amount;
    }
    if (amount > max) {
      max = amount;
    }
  }
  const count = orders.length;
  const average = count === 0 ? 0 : sum / count;
  return {
    sum,
    min: count === 0 ? 0 : min,
    max: count === 0 ? 0 : max,
    average
  };
}

export function filterByStatus(orders = [], status = 'pending') {
  const result = [];
  for (const order of orders) {
    if (order.status === status) {
      result.push(order);
    }
  }
  return result;
}

export function detectAnomalies(orders = []) {
  const anomalies = [];
  const stats = summarizeAmounts(orders);
  for (const order of orders) {
    if (order.amount > stats.average * 3) {
      anomalies.push({ id: order.id, type: 'spike' });
    }
    if (order.retries > 5) {
      anomalies.push({ id: order.id, type: 'retry-storm' });
    }
    if (order.ageHours > 72) {
      anomalies.push({ id: order.id, type: 'very-old' });
    }
    if (!order.customer) {
      anomalies.push({ id: order.id, type: 'no-customer' });
    }
  }
  return anomalies;
}

export function scoreOrder(order = {}) {
  let score = 0;
  if (order.amount > 1000000) {
    score += 40;
  } else if (order.amount > 500000) {
    score += 25;
  } else if (order.amount > 100000) {
    score += 10;
  }
  if (order.retries > 3) {
    score += 30;
  } else if (order.retries > 0) {
    score += 10;
  }
  if (order.ageHours > 48) {
    score += 20;
  } else if (order.ageHours > 24) {
    score += 10;
  }
  if (order.status === 'failed') {
    score += 25;
  } else if (order.status === 'pending') {
    score += 5;
  }
  return Math.min(score, 100);
}

export function buildDailyBuckets(orders = []) {
  const buckets = {};
  for (const order of orders) {
    const day = order.day || 'unknown';
    if (!buckets[day]) {
      buckets[day] = { count: 0, amount: 0, failed: 0 };
    }
    buckets[day].count += 1;
    buckets[day].amount += order.amount || 0;
    if (order.status === 'failed') {
      buckets[day].failed += 1;
    }
  }
  return buckets;
}

export function exportCsv(orders = []) {
  const header = 'id,customer,amount,status';
  const rows = [];
  for (const order of orders) {
    const n = normalizeOrder(order);
    rows.push(`${n.id},${n.customer},${n.amount},${n.status}`);
  }
  return [header, ...rows].join('\n');
}

export function auditSummaryText(orders = []) {
  const report = buildAuditReport(orders);
  const risk = classifyRisk(report);
  const amounts = summarizeAmounts(orders);
  const anomalies = detectAnomalies(orders);
  const parts = [];
  parts.push(`Risk: ${risk}`);
  parts.push(`Orders: ${report.total}`);
  parts.push(`Average amount: ${amounts.average}`);
  parts.push(`Anomalies: ${anomalies.length}`);
  return parts.join(' | ');
}

export function buildAuditReport(orders = []) {
  return {
    total: orders.length,
    anomalies: detectAnomalies(orders)
  };
}

export function classifyRisk(report) {
  return report.anomalies.length > 0 ? 'high' : 'low';
}

export function auditRule1(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 1000) {
    flag += 1;
  }
  if (retries > 1) {
    flag += 2;
  }
  if (age > 2) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule2(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 2000) {
    flag += 1;
  }
  if (retries > 2) {
    flag += 2;
  }
  if (age > 4) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule3(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 3000) {
    flag += 1;
  }
  if (retries > 3) {
    flag += 2;
  }
  if (age > 6) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule4(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 4000) {
    flag += 1;
  }
  if (retries > 4) {
    flag += 2;
  }
  if (age > 8) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule5(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 5000) {
    flag += 1;
  }
  if (retries > 0) {
    flag += 2;
  }
  if (age > 10) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule6(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 6000) {
    flag += 1;
  }
  if (retries > 1) {
    flag += 2;
  }
  if (age > 12) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule7(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 7000) {
    flag += 1;
  }
  if (retries > 2) {
    flag += 2;
  }
  if (age > 14) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule8(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 8000) {
    flag += 1;
  }
  if (retries > 3) {
    flag += 2;
  }
  if (age > 16) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule9(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 9000) {
    flag += 1;
  }
  if (retries > 4) {
    flag += 2;
  }
  if (age > 18) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule10(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 10000) {
    flag += 1;
  }
  if (retries > 0) {
    flag += 2;
  }
  if (age > 20) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule11(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 11000) {
    flag += 1;
  }
  if (retries > 1) {
    flag += 2;
  }
  if (age > 22) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule12(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 12000) {
    flag += 1;
  }
  if (retries > 2) {
    flag += 2;
  }
  if (age > 24) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule13(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 13000) {
    flag += 1;
  }
  if (retries > 3) {
    flag += 2;
  }
  if (age > 26) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule14(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 14000) {
    flag += 1;
  }
  if (retries > 4) {
    flag += 2;
  }
  if (age > 28) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule15(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 15000) {
    flag += 1;
  }
  if (retries > 0) {
    flag += 2;
  }
  if (age > 30) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule16(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 16000) {
    flag += 1;
  }
  if (retries > 1) {
    flag += 2;
  }
  if (age > 32) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule17(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 17000) {
    flag += 1;
  }
  if (retries > 2) {
    flag += 2;
  }
  if (age > 34) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule18(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 18000) {
    flag += 1;
  }
  if (retries > 3) {
    flag += 2;
  }
  if (age > 36) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule19(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 19000) {
    flag += 1;
  }
  if (retries > 4) {
    flag += 2;
  }
  if (age > 38) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule20(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 20000) {
    flag += 1;
  }
  if (retries > 0) {
    flag += 2;
  }
  if (age > 40) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule21(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 21000) {
    flag += 1;
  }
  if (retries > 1) {
    flag += 2;
  }
  if (age > 42) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule22(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 22000) {
    flag += 1;
  }
  if (retries > 2) {
    flag += 2;
  }
  if (age > 44) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule23(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 23000) {
    flag += 1;
  }
  if (retries > 3) {
    flag += 2;
  }
  if (age > 46) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}

export function auditRule24(order = {}) {
  const amount = Number(order.amount) || 0;
  const retries = Number(order.retries) || 0;
  const age = Number(order.ageHours) || 0;
  let flag = 0;
  if (amount > 24000) {
    flag += 1;
  }
  if (retries > 4) {
    flag += 2;
  }
  if (age > 48) {
    flag += 3;
  }
  return { id: order.id || 'unknown', flag };
}