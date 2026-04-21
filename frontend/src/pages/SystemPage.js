import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '../auth';

const POLL_MS = 3000;
const MAX_POINTS = 7200; // 6 hours at 3s intervals
const RENDER_POINTS = 300; // max SVG path points for performance

function lineColor(percent) {
  if (percent > 85) return '#ef4444';
  if (percent > 60) return '#f59e0b';
  return null; // use default passed in
}

function downsample(data, n) {
  if (data.length <= n) return data;
  const result = [];
  const step = (data.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) {
    const idx = Math.round(i * step);
    result.push(data[Math.min(idx, data.length - 1)]);
  }
  return result;
}

function LineChart({ data, max = 100, color, label, unit = '%', height = 90 }) {
  const W = 400;
  const H = height;
  const pad = { top: 8, right: 8, bottom: 4, left: 8 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  if (data.length < 2) {
    return (
      <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
        Collecting data...
      </div>
    );
  }

  const sampled = downsample(data, RENDER_POINTS);
  const points = sampled.map((v, i) => {
    const x = pad.left + (i / (sampled.length - 1)) * chartW;
    const y = pad.top + chartH - (Math.min(v, max) / max) * chartH;
    return [x, y];
  });

  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaD = pathD +
    ` L${points[points.length - 1][0].toFixed(1)},${(pad.top + chartH).toFixed(1)}` +
    ` L${points[0][0].toFixed(1)},${(pad.top + chartH).toFixed(1)} Z`;

  const current = data[data.length - 1];
  const currentColor = lineColor(current) || color;

  // gridlines at 25 / 50 / 75%
  const gridLines = [25, 50, 75].map(pct => {
    const y = pad.top + chartH - (pct / max) * chartH;
    return { y, pct };
  });

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: currentColor }}>
          {typeof current === 'number' ? `${current}${unit}` : '—'}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: H, display: 'block', overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {gridLines.map(({ y, pct }) => (
          <g key={pct}>
            <line x1={pad.left} y1={y} x2={pad.left + chartW} y2={y}
              stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
            <text x={pad.left + 2} y={y - 2} fontSize="9" fill="#d1d5db">{pct}%</text>
          </g>
        ))}
        {/* Area fill */}
        <path d={areaD} fill={currentColor} fillOpacity="0.12" />
        {/* Line */}
        <path d={pathD} fill="none" stroke={currentColor} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        {/* Current value dot */}
        <circle
          cx={points[points.length - 1][0]}
          cy={points[points.length - 1][1]}
          r="3"
          fill={currentColor}
        />
        {/* Border */}
        <rect x={pad.left} y={pad.top} width={chartW} height={chartH}
          fill="none" stroke="#e5e7eb" strokeWidth="1" rx="4" />
      </svg>
    </div>
  );
}

function StatCard({ title, children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{
        margin: '0 0 16px', fontSize: '0.85rem', color: '#6b7280',
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>{title}</h3>
      {children}
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.88rem', borderTop: '1px solid #f3f4f6' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#111827' }}>{value}</span>
    </div>
  );
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function push(arr, val) {
  const next = [...arr, val];
  return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
}

export default function SystemPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const history = useRef({ cpu: [], ram: [], heap: [], rss: [], load1: [] });

  const [, forceRender] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/system/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();

      const h = history.current;
      if (data.cpu.usagePercent !== null) h.cpu = push(h.cpu, data.cpu.usagePercent);
      h.ram = push(h.ram, data.ram.usedPercent);
      h.heap = push(h.heap, Math.round((data.process.heapUsedMB / data.process.heapTotalMB) * 100));
      h.rss = push(h.rss, data.process.rssMB);
      h.load1 = push(h.load1, parseFloat(data.cpu.loadAvg[0].toFixed(2)));

      setStats(data);
      setLastUpdated(new Date());
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

  const { cpu, ram, process: proc, uptime, platform, arch } = stats;
  const h = history.current;
  const maxLoad = Math.max(cpu.cores, ...h.load1, 1);

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>System Monitor</h2>
        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
          Live · {POLL_MS / 1000}s refresh · 6h window
          {lastUpdated && ` · ${lastUpdated.toLocaleTimeString()}`}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

        <StatCard title="CPU Usage">
          <LineChart data={h.cpu} max={100} color="#3b82f6" label="Usage over time" unit="%" />
          <div style={{ marginTop: 12 }}>
            <MetricRow label="Cores" value={cpu.cores} />
            <MetricRow label="Load avg (1m)" value={cpu.loadAvg[0].toFixed(2)} />
            <MetricRow label="Load avg (5m)" value={cpu.loadAvg[1].toFixed(2)} />
            <MetricRow label="Load avg (15m)" value={cpu.loadAvg[2].toFixed(2)} />
            <MetricRow label="Model" value={cpu.model.split('@')[0].trim()} />
          </div>
        </StatCard>

        <StatCard title="Load Average">
          <LineChart data={h.load1} max={maxLoad} color="#6366f1" label="1-min load avg" unit="" />
          <div style={{ marginTop: 12 }}>
            <MetricRow label="1 min" value={cpu.loadAvg[0].toFixed(2)} />
            <MetricRow label="5 min" value={cpu.loadAvg[1].toFixed(2)} />
            <MetricRow label="15 min" value={cpu.loadAvg[2].toFixed(2)} />
            <MetricRow label="CPU cores" value={cpu.cores} />
          </div>
        </StatCard>

        <StatCard title="Memory (RAM)">
          <LineChart data={h.ram} max={100} color="#10b981" label="Used %" unit="%" />
          <div style={{ marginTop: 12 }}>
            <MetricRow label="Used" value={`${ram.usedMB} MB`} />
            <MetricRow label="Free" value={`${ram.freeMB} MB`} />
            <MetricRow label="Total" value={`${ram.totalMB} MB`} />
          </div>
        </StatCard>

        <StatCard title="Node.js Heap">
          <LineChart data={h.heap} max={100} color="#8b5cf6" label="Heap used %" unit="%" />
          <div style={{ marginTop: 12 }}>
            <MetricRow label="Heap used" value={`${proc.heapUsedMB} MB`} />
            <MetricRow label="Heap total" value={`${proc.heapTotalMB} MB`} />
            <MetricRow label="RSS" value={`${proc.rssMB} MB`} />
            <MetricRow label="Server uptime" value={formatUptime(uptime.serverSeconds)} />
            <MetricRow label="System uptime" value={formatUptime(uptime.systemSeconds)} />
            <MetricRow label="Platform" value={`${platform} / ${arch}`} />
          </div>
        </StatCard>

      </div>
    </div>
  );
}
