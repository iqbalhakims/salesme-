import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../auth';

const POLL_MS = 3000;

function GaugeBar({ percent, color }) {
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 8, height: 14, overflow: 'hidden', margin: '6px 0' }}>
      <div style={{
        width: `${Math.min(percent, 100)}%`,
        background: percent > 85 ? '#ef4444' : percent > 60 ? '#f59e0b' : color,
        height: '100%',
        borderRadius: 8,
        transition: 'width 0.4s ease',
      }} />
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
      <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      {children}
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.9rem' }}>
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

export default function SystemPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/system/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
      setError(null);
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

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>System Monitor</h2>
        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
          Auto-refresh every {POLL_MS / 1000}s
          {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

        <StatCard title="CPU">
          {cpu.usagePercent !== null ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Usage</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: cpu.usagePercent > 85 ? '#ef4444' : '#111827' }}>
                  {cpu.usagePercent}%
                </span>
              </div>
              <GaugeBar percent={cpu.usagePercent} color="#3b82f6" />
            </>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: '0 0 8px' }}>Usage available after first poll</p>
          )}
          <MetricRow label="Cores" value={cpu.cores} />
          <MetricRow label="Load avg (1m)" value={cpu.loadAvg[0].toFixed(2)} />
          <MetricRow label="Load avg (5m)" value={cpu.loadAvg[1].toFixed(2)} />
          <MetricRow label="Load avg (15m)" value={cpu.loadAvg[2].toFixed(2)} />
          <MetricRow label="Model" value={cpu.model.split('@')[0].trim()} />
        </StatCard>

        <StatCard title="Memory (RAM)">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Used</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: ram.usedPercent > 85 ? '#ef4444' : '#111827' }}>
              {ram.usedPercent}%
            </span>
          </div>
          <GaugeBar percent={ram.usedPercent} color="#10b981" />
          <MetricRow label="Used" value={`${ram.usedMB} MB`} />
          <MetricRow label="Free" value={`${ram.freeMB} MB`} />
          <MetricRow label="Total" value={`${ram.totalMB} MB`} />
        </StatCard>

        <StatCard title="Node.js Process">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Heap used</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>
              {proc.heapUsedMB} MB
            </span>
          </div>
          <GaugeBar percent={Math.round((proc.heapUsedMB / proc.heapTotalMB) * 100)} color="#8b5cf6" />
          <MetricRow label="Heap total" value={`${proc.heapTotalMB} MB`} />
          <MetricRow label="RSS" value={`${proc.rssMB} MB`} />
          <MetricRow label="Server uptime" value={formatUptime(uptime.serverSeconds)} />
          <MetricRow label="System uptime" value={formatUptime(uptime.systemSeconds)} />
          <MetricRow label="Platform" value={`${platform} (${arch})`} />
        </StatCard>

      </div>
    </div>
  );
}
