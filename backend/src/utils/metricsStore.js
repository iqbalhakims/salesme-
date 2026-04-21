/**
 * In-memory per-minute bucket store.
 * Keeps up to MAX_BUCKETS minutes (6 hours) of history.
 */
const MAX_BUCKETS = 360;

const buckets = []; // [{ minuteTs, requests, errors4xx, errors5xx, totalLatencyMs }]
const dbLatencies = []; // rolling last 500 query durations (ms)
const slowQueries = []; // last 50 slow queries (>100ms)
const SLOW_THRESHOLD_MS = 100;
const MAX_DB_SAMPLES = 500;
const MAX_SLOW = 50;

function currentMinuteTs() {
  return Math.floor(Date.now() / 60000) * 60000;
}

function getOrCreateBucket() {
  const ts = currentMinuteTs();
  let b = buckets[buckets.length - 1];
  if (!b || b.minuteTs !== ts) {
    b = { minuteTs: ts, requests: 0, errors4xx: 0, errors5xx: 0, totalLatencyMs: 0 };
    buckets.push(b);
    if (buckets.length > MAX_BUCKETS) buckets.shift();
  }
  return b;
}

exports.recordRequest = function (statusCode, latencyMs) {
  const b = getOrCreateBucket();
  b.requests++;
  b.totalLatencyMs += latencyMs;
  if (statusCode >= 400 && statusCode < 500) b.errors4xx++;
  if (statusCode >= 500) b.errors5xx++;
};

exports.recordDbQuery = function (latencyMs) {
  dbLatencies.push(latencyMs);
  if (dbLatencies.length > MAX_DB_SAMPLES) dbLatencies.shift();
  if (latencyMs >= SLOW_THRESHOLD_MS) {
    slowQueries.push({ ts: Date.now(), latencyMs });
    if (slowQueries.length > MAX_SLOW) slowQueries.shift();
  }
};

exports.getBuckets = function () { return [...buckets]; };

exports.getDbStats = function () {
  if (dbLatencies.length === 0) return { avgMs: null, p95Ms: null, slowCount: 0, recentSlow: [] };
  const sorted = [...dbLatencies].sort((a, b) => a - b);
  const avg = Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  return {
    avgMs: avg,
    p95Ms: p95,
    slowCount: slowQueries.length,
    recentSlow: slowQueries.slice(-10).reverse(),
  };
};
