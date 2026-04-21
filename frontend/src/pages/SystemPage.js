import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '../auth';

const POLL_MS = 3000;
const MAX_POINTS = 7200;   // 6 hours at 3s intervals
const RENDER_POINTS = 300;

// ─── helpers ────────────────────────────────────────────────────────────────

function lineColor(pct, defaultColor) {
  if (pct > 85) return '#ef4444';
  if (pct > 60) return '#f59e0b';
  return defaultColor;
}

function downsamplePair(vals, times, n) {
  if (vals.length <= n) return { vals, times };
  const ov = [], ot = [];
  const step = (vals.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) {
    const idx = Math.min(Math.round(i * step), vals.length - 1);
    ov.push(vals[idx]); ot.push(times[idx]);
  }
  return { vals: ov, times: ot };
}

function pushPair(vals, times, val, now) {
  const nv = [...vals, val], nt = [...times, now];
  if (nv.length > MAX_POINTS) { nv.shift(); nt.shift(); }
  return { vals: nv, times: nt };
}

function formatUptime(s) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
    m = Math.floor((s % 3600) / 60), sc = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sc}s`;
  return `${m}m ${sc}s`;
}

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ─── LineChart ───────────────────────────────────────────────────────────────

function LineChart({ vals, times, max = 100, color, label, unit = '%', height = 80 }) {
  const W = 400, LABEL_H = 16;
  const H = height + LABEL_H;
  const pad = { top: 8, right: 8, bottom: LABEL_H + 4, left: 8 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;

  if (vals.length < 2) {
    return (
      <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.78rem' }}>
        Collecting data...
      </div>
    );
  }

  const { vals: sv, times: st } = downsamplePair(vals, times, RENDER_POINTS);
  const pts = sv.map((v, i) => [
    pad.left + (i / (sv.length - 1)) * cW,
    pad.top + cH - (Math.min(v, max) / max) * cH,
  ]);

  const pathD = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaD = pathD
    + ` L${pts[pts.length - 1][0].toFixed(1)},${(pad.top + cH).toFixed(1)}`
    + ` L${pts[0][0].toFixed(1)},${(pad.top + cH).toFixed(1)} Z`;

  const current = vals[vals.length - 1];
  const stroke = lineColor(current, color);

  const hGrid = [25, 50, 75].map(pct => ({
    y: pad.top + cH - (pct / max) * cH, label: `${pct}%`,
  }));

  const hourTicks = [];
  if (st.length >= 2) {
    const t0 = st[0].getTime(), tN = st[st.length - 1].getTime(), span = tN - t0;
    for (let hMs = Math.ceil(t0 / 3600000) * 3600000; hMs <= tN; hMs += 3600000) {
      const frac = (hMs - t0) / span;
      if (frac < 0 || frac > 1) continue;
      hourTicks.push({ x: pad.left + frac * cW, label: fmtTime(new Date(hMs)) });
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: stroke }}>
          {typeof current === 'number' ? `${current}${unit}` : '—'}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }} preserveAspectRatio="none">
        {hGrid.map(({ y, label: gl }) => (
          <g key={gl}>
            <line x1={pad.left} y1={y} x2={pad.left + cW} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
            <text x={pad.left + 2} y={y - 2} fontSize="9" fill="#d1d5db">{gl}</text>
          </g>
        ))}
        {hourTicks.map(({ x, label: tl }) => (
          <g key={tl}>
            <line x1={x} y1={pad.top} x2={x} y2={pad.top + cH} stroke="#d1d5db" strokeWidth="1" strokeDasharray="2,4" />
            <text x={x} y={pad.top + cH + LABEL_H - 3} fontSize="9" fill="#9ca3af" textAnchor="middle">{tl}</text>
          </g>
        ))}
        <path d={areaD} fill={stroke} fillOpacity="0.12" />
        <path d={pathD} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={stroke} />
        <rect x={pad.left} y={pad.top} width={cW} height={cH} fill="none" stroke="#e5e7eb" strokeWidth="1" rx="4" />
      </svg>
    </div>
  );
}

// ─── BarChart (for API requests per minute) ──────────────────────────────────

function BarChart({ buckets, height = 80 }) {
  const W = 400, LABEL_H = 16;
  const H = height + LABEL_H;
  const pad = { top: 8, right: 8, bottom: LABEL_H + 4, left: 8 };
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;

  if (!buckets || buckets.length === 0) {
    return (
      <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.78rem' }}>
        Collecting data...
      </div>
    );
  }

  const maxReq = Math.max(...buckets.map(b => b.requests), 1);
  const barW = cW / buckets.length;

  const hourTicks = [];
  if (buckets.length >= 2) {
    const t0 = buckets[0].minuteTs, tN = buckets[buckets.length - 1].minuteTs, span = tN - t0 || 1;
    for (let hMs = Math.ceil(t0 / 3600000) * 3600000; hMs <= tN; hMs += 3600000) {
      const frac = (hMs - t0) / span;
      if (frac < 0 || frac > 1) continue;
      hourTicks.push({ x: pad.left + frac * cW, label: fmtTime(new Date(hMs)) });
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }} preserveAspectRatio="none">
      {buckets.map((b, i) => {
        const x = pad.left + i * barW;
        const reqH = (b.requests / maxReq) * cH;
        const errH = ((b.errors4xx + b.errors5xx) / maxReq) * cH;
        return (
          <g key={b.minuteTs}>
            <rect x={x + 0.5} y={pad.top + cH - reqH} width={Math.max(barW - 1, 1)} height={reqH} fill="#3b82f6" fillOpacity="0.5" />
            {errH > 0 && <rect x={x + 0.5} y={pad.top + cH - errH} width={Math.max(barW - 1, 1)} height={errH} fill="#ef4444" fillOpacity="0.8" />}
          </g>
        );
      })}
      {hourTicks.map(({ x, label }) => (
        <g key={label}>
          <line x1={x} y1={pad.top} x2={x} y2={pad.top + cH} stroke="#d1d5db" strokeWidth="1" strokeDasharray="2,4" />
          <text x={x} y={pad.top + cH + LABEL_H - 3} fontSize="9" fill="#9ca3af" textAnchor="middle">{label}</text>
        </g>
      ))}
      <rect x={pad.left} y={pad.top} width={cW} height={cH} fill="none" stroke="#e5e7eb" strokeWidth="1" rx="4" />
    </svg>
  );
}

// ─── UI primitives ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{
        margin: '0 0 12px', fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        borderBottom: '1px solid #f3f4f6', paddingBottom: 6,
      }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.85rem', borderTop: '1px solid #f9fafb' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 600, color: highlight || '#111827' }}>{value}</span>
    </div>
  );
}

function StatBadge({ label, value, sub, color }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 4px' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: color || '#111827', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function SystemPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const history = useRef({
    cpu:   { vals: [], times: [] },
    ram:   { vals: [], times: [] },
    heap:  { vals: [], times: [] },
    load1: { vals: [], times: [] },
  });
  const [, forceRender] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/system/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      const now = new Date();
      const h = history.current;

      if (data.cpu.usagePercent !== null) {
        const r = pushPair(h.cpu.vals, h.cpu.times, data.cpu.usagePercent, now);
        h.cpu = r;
      }
      h.ram  = pushPair(h.ram.vals,  h.ram.times,  data.ram.usedPercent, now);
      h.heap = pushPair(h.heap.vals, h.heap.times,
        Math.round((data.process.heapUsedMB / data.process.heapTotalMB) * 100), now);
      h.load1 = pushPair(h.load1.vals, h.load1.times,
        parseFloat(data.cpu.loadAvg[0].toFixed(2)), now);

      setStats(data);
      setLastUpdated(now);
      setError(null);
      forceRender(n => n + 1);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, POLL_MS);
    return () => clearInterval(id);
  }, [fetchStats]);

  if (error) return <p style={{ color: '#ef4444', padding: 16 }}>Error: {error}</p>;
  if (!stats) return <p style={{ padding: 16, color: '#6b7280' }}>Loading system stats...</p>;

  const { cpu, ram, process: proc, uptime, platform, arch, api, db, storage } = stats;
  const h = history.current;
  const maxLoad = Math.max(cpu.cores, ...h.load1.vals, 1);

  // API totals from buckets
  const totalReq   = api.buckets.reduce((s, b) => s + b.requests, 0);
  const total4xx   = api.buckets.reduce((s, b) => s + b.errors4xx, 0);
  const total5xx   = api.buckets.reduce((s, b) => s + b.errors5xx, 0);
  const lastBucket = api.buckets[api.buckets.length - 1];
  const reqPerMin  = lastBucket ? lastBucket.requests : 0;

  return (
    <div style={{ padding: '8px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>System Monitor</h2>
        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
          Live · {POLL_MS / 1000}s refresh · 6h window · {lastUpdated && lastUpdated.toLocaleTimeString()}
        </span>
      </div>

      {/* ── SECTION 1: Infrastructure ── */}
      <Section title="Infrastructure">
        <Card title="CPU Usage">
          <LineChart vals={h.cpu.vals} times={h.cpu.times} max={100} color="#3b82f6" label="Usage %" unit="%" />
          <div style={{ marginTop: 8 }}>
            <Row label="Cores" value={cpu.cores} />
            <Row label="Model" value={cpu.model.split('@')[0].trim()} />
          </div>
        </Card>

        <Card title="Load Average">
          <LineChart vals={h.load1.vals} times={h.load1.times} max={maxLoad} color="#6366f1" label="1-min load" unit="" />
          <div style={{ marginTop: 8 }}>
            <Row label="1 min" value={cpu.loadAvg[0].toFixed(2)} />
            <Row label="5 min" value={cpu.loadAvg[1].toFixed(2)} />
            <Row label="15 min" value={cpu.loadAvg[2].toFixed(2)} />
          </div>
        </Card>

        <Card title="Memory (RAM)">
          <LineChart vals={h.ram.vals} times={h.ram.times} max={100} color="#10b981" label="Used %" unit="%" />
          <div style={{ marginTop: 8 }}>
            <Row label="Used" value={`${ram.usedMB} MB`} />
            <Row label="Free" value={`${ram.freeMB} MB`} />
            <Row label="Total" value={`${ram.totalMB} MB`} />
          </div>
        </Card>

        <Card title="Node.js Process">
          <LineChart vals={h.heap.vals} times={h.heap.times} max={100} color="#8b5cf6" label="Heap used %" unit="%" />
          <div style={{ marginTop: 8 }}>
            <Row label="Heap used" value={`${proc.heapUsedMB} MB`} />
            <Row label="Heap total" value={`${proc.heapTotalMB} MB`} />
            <Row label="RSS" value={`${proc.rssMB} MB`} />
            <Row label="Server uptime" value={formatUptime(uptime.serverSeconds)} />
            <Row label="System uptime" value={formatUptime(uptime.systemSeconds)} />
            <Row label="Platform" value={`${platform} / ${arch}`} />
          </div>
        </Card>
      </Section>

      {/* ── SECTION 2: API Traffic ── */}
      <Section title="API Traffic">
        <Card title="Requests per Minute">
          <BarChart buckets={api.buckets} height={80} />
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10 }}>
            <StatBadge label="This minute" value={reqPerMin} color="#3b82f6" />
            <StatBadge label="Total (session)" value={totalReq} />
            <StatBadge label="4xx errors" value={total4xx} color={total4xx > 0 ? '#f59e0b' : undefined} />
            <StatBadge label="5xx errors" value={total5xx} color={total5xx > 0 ? '#ef4444' : undefined} />
          </div>
        </Card>

        <Card title="Response Latency (per minute avg)">
          {api.buckets.length > 0 ? (
            <>
              <BarChart
                buckets={api.buckets.map(b => ({ ...b, requests: b.avgLatencyMs, errors4xx: 0, errors5xx: 0 }))}
                height={80}
              />
              <div style={{ marginTop: 8 }}>
                {api.buckets.slice(-1)[0] && (
                  <Row label="Last minute avg" value={`${api.buckets.slice(-1)[0].avgLatencyMs} ms`} />
                )}
              </div>
            </>
          ) : (
            <div style={{ color: '#9ca3af', fontSize: '0.8rem', padding: '20px 0', textAlign: 'center' }}>Collecting data...</div>
          )}
        </Card>
      </Section>

      {/* ── SECTION 3: Database ── */}
      <Section title="Database">
        <Card title="Query Latency">
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 0' }}>
            <StatBadge
              label="Avg latency"
              value={db.avgMs !== null ? `${db.avgMs}ms` : '—'}
              color={db.avgMs > 100 ? '#ef4444' : db.avgMs > 50 ? '#f59e0b' : '#10b981'}
            />
            <StatBadge
              label="P95 latency"
              value={db.p95Ms !== null ? `${db.p95Ms}ms` : '—'}
              color={db.p95Ms > 200 ? '#ef4444' : undefined}
            />
            <StatBadge
              label={`Slow queries (>${'>'}100ms)`}
              value={db.slowCount}
              color={db.slowCount > 0 ? '#f59e0b' : undefined}
            />
          </div>
          {db.recentSlow && db.recentSlow.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Recent slow queries</div>
              {db.recentSlow.map((q, i) => (
                <Row key={i}
                  label={new Date(q.ts).toLocaleTimeString()}
                  value={`${q.latencyMs}ms`}
                  highlight={q.latencyMs > 500 ? '#ef4444' : '#f59e0b'}
                />
              ))}
            </div>
          )}
        </Card>
      </Section>

      {/* ── SECTION 4: Storage ── */}
      <Section title="Upload Storage">
        <Card title="Disk Usage">
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 0' }}>
            <StatBadge label="Used" value={`${storage.usedMB} MB`} color="#f59e0b" />
            <StatBadge label="Files" value={storage.fileCount} />
          </div>
          <Row label="Path" value="backend/uploads/" />
          <Row label="Avg per file"
            value={storage.fileCount > 0 ? `${(storage.usedMB / storage.fileCount).toFixed(2)} MB` : '—'} />
        </Card>
      </Section>

    </div>
  );
}
