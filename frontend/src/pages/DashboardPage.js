import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../auth';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function statusColor(s) {
  const map = {
    scheduled: '#3b82f6', completed: '#10b981', cancelled: '#ef4444',
    new: '#6366f1', contacted: '#f59e0b', closed: '#10b981',
    available: '#10b981', sold: '#6b7280', reserved: '#f59e0b',
  };
  return map[s] || '#9ca3af';
}

// ─── UI primitives ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
        padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)')}
    >
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: color || '#111827', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{
      margin: '24px 0 12px', fontSize: '0.7rem', fontWeight: 700,
      color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em',
      borderBottom: '1px solid #f3f4f6', paddingBottom: 6,
    }}>{children}</h3>
  );
}

function Badge({ status }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 99,
      fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize',
      background: statusColor(status) + '20', color: statusColor(status),
    }}>{status}</span>
  );
}

function Table({ headers, rows, emptyMsg }) {
  if (!rows || rows.length === 0) {
    return <div style={{ color: '#9ca3af', fontSize: '0.85rem', padding: '12px 0' }}>{emptyMsg}</div>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#9ca3af', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '8px', color: '#374151', verticalAlign: 'middle' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SystemHealth({ cpu, ram }) {
  if (!cpu && !ram) return null;

  function Bar({ pct }) {
    const color = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s' }} />
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>System Health</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cpu != null && (
          <div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 4 }}>CPU</div>
            <Bar pct={cpu} />
          </div>
        )}
        {ram != null && (
          <div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 4 }}>RAM</div>
            <Bar pct={ram} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function DashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [sysStats, setSysStats] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [dashRes, sysRes] = await Promise.all([
        authFetch('/api/dashboard/stats'),
        authFetch('/api/system/stats'),
      ]);
      if (!dashRes.ok) throw new Error('Failed to load dashboard');
      const dash = await dashRes.json();
      setData(dash.data);
      if (sysRes.ok) {
        const sys = await sysRes.json();
        setSysStats(sys);
      }
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  if (error) return <p style={{ color: '#ef4444', padding: 16 }}>Error: {error}</p>;
  if (!data) return <p style={{ padding: 16, color: '#6b7280' }}>Loading dashboard...</p>;

  const { cars, leads, appointments, todayAppts, upcomingAppts, recentLeads, users } = data;

  return (
    <div style={{ padding: '8px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Dashboard</h2>
        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
          Auto-refresh 30s · {lastUpdated && lastUpdated.toLocaleTimeString()}
        </span>
      </div>

      {/* ── Cars ── */}
      <SectionTitle>Cars</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="Total" value={cars.total} onClick={() => onNavigate('cars')} />
        <StatCard label="Available" value={cars.available} color="#10b981" onClick={() => onNavigate('cars')} />
        <StatCard label="Reserved" value={cars.reserved} color="#f59e0b" onClick={() => onNavigate('cars')} />
        <StatCard label="Sold" value={cars.sold} color="#6b7280" onClick={() => onNavigate('cars')} />
      </div>

      {/* ── Leads ── */}
      <SectionTitle>Leads</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="Total" value={leads.total} onClick={() => onNavigate('leads')} />
        <StatCard label="New" value={leads.new_leads} color="#6366f1" onClick={() => onNavigate('leads')} />
        <StatCard label="Contacted" value={leads.contacted} color="#f59e0b" onClick={() => onNavigate('leads')} />
        <StatCard label="Closed" value={leads.closed} color="#10b981" onClick={() => onNavigate('leads')} />
        <StatCard label="Follow-up Today" value={leads.followup_today} color={leads.followup_today > 0 ? '#ef4444' : undefined} onClick={() => onNavigate('leads')} />
      </div>

      {/* ── Appointments ── */}
      <SectionTitle>Appointments</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="Today" value={appointments.today} color={appointments.today > 0 ? '#3b82f6' : undefined} onClick={() => onNavigate('appointments')} />
        <StatCard label="Scheduled" value={appointments.scheduled} color="#3b82f6" onClick={() => onNavigate('appointments')} />
        <StatCard label="Completed" value={appointments.completed} color="#10b981" onClick={() => onNavigate('appointments')} />
        <StatCard label="Cancelled" value={appointments.cancelled} color="#9ca3af" onClick={() => onNavigate('appointments')} />
      </div>

      {/* ── Users + System ── */}
      <SectionTitle>Users & System</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <StatCard label="Total Users" value={users.total} sub={`${users.admins} admin · ${users.staff} staff`} onClick={() => onNavigate('users')} />
        <SystemHealth
          cpu={sysStats?.cpu?.usagePercent}
          ram={sysStats?.ram?.usedPercent}
        />
      </div>

      {/* ── Today's Appointments ── */}
      <SectionTitle>Today's Appointments</SectionTitle>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table
          headers={['Time', 'Customer', 'Phone', 'Car', 'Status', 'Notes']}
          emptyMsg="No appointments today."
          rows={todayAppts.map(a => [
            fmtDate(a.appointment_date),
            a.lead_name,
            a.lead_phone,
            a.car_model ? `${a.car_model}${a.car_ref ? ` (${a.car_ref})` : ''}` : '—',
            <Badge key={a.id} status={a.status} />,
            a.notes || '—',
          ])}
        />
      </div>

      {/* ── Upcoming Appointments ── */}
      <SectionTitle>Upcoming Appointments</SectionTitle>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table
          headers={['Date & Time', 'Customer', 'Phone', 'Car', 'Notes']}
          emptyMsg="No upcoming appointments."
          rows={upcomingAppts.map(a => [
            fmtDate(a.appointment_date),
            a.lead_name,
            a.lead_phone,
            a.car_model ? `${a.car_model}${a.car_ref ? ` (${a.car_ref})` : ''}` : '—',
            a.notes || '—',
          ])}
        />
      </div>

      {/* ── Recent Leads ── */}
      <SectionTitle>Recent Leads</SectionTitle>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table
          headers={['Name', 'Phone', 'Car Interest', 'Status', 'Created']}
          emptyMsg="No leads yet."
          rows={recentLeads.map(l => [
            l.name,
            l.phone,
            l.car_model ? `${l.car_model}${l.car_ref ? ` (${l.car_ref})` : ''}` : '—',
            <Badge key={l.id} status={l.status} />,
            fmtDate(l.created_at),
          ])}
        />
      </div>

    </div>
  );
}
