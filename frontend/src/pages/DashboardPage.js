import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../auth';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

const STATUS_STYLES = {
  scheduled:  { bg: '#eff6ff', color: '#2563eb' },
  completed:  { bg: '#f0fdf4', color: '#16a34a' },
  cancelled:  { bg: '#fef2f2', color: '#dc2626' },
  new:        { bg: '#eef2ff', color: '#4f46e5' },
  contacted:  { bg: '#fffbeb', color: '#d97706' },
  follow_up:  { bg: '#fff7ed', color: '#ea580c' },
  closed:     { bg: '#f0fdf4', color: '#16a34a' },
  available:  { bg: '#f0fdf4', color: '#16a34a' },
  sold:       { bg: '#f9fafb', color: '#6b7280' },
  reserved:   { bg: '#fffbeb', color: '#d97706' },
};

function Badge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 99,
      fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
      letterSpacing: '0.03em', background: s.bg, color: s.color,
    }}>{status?.replace('_', ' ')}</span>
  );
}

function Avatar({ name }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: color,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
}

function KpiCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 12, padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `4px solid ${color || '#e5e7eb'}`,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: (color || '#6b7280') + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem',
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', lineHeight: 1.1, marginTop: 2 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '28px 0 12px' }}>
      <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</h3>
      {action}
    </div>
  );
}

function Panel({ children, noPad }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: noPad ? 0 : '16px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>{children}</div>
  );
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color, minWidth: 38, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

function EmptyRow({ msg, cols }) {
  return (
    <tr>
      <td colSpan={cols} style={{ padding: '24px 16px', color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center' }}>{msg}</td>
    </tr>
  );
}

export default function DashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [sysStats, setSysStats] = useState(null);
  const [visitors, setVisitors] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [dashRes, sysRes, visRes] = await Promise.all([
        authFetch('/api/dashboard/stats'),
        authFetch('/api/system/stats'),
        authFetch('/api/visitors/stats'),
      ]);
      if (!dashRes.ok) throw new Error('Failed to load dashboard');
      const dash = await dashRes.json();
      setData(dash.data);
      if (sysRes.ok) setSysStats(await sysRes.json());
      if (visRes.ok) { const v = await visRes.json(); setVisitors(v.data); }
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

  if (error) return (
    <div style={{ margin: '40px auto', maxWidth: 400, textAlign: 'center', color: '#dc2626' }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚠️</div>
      <div style={{ fontWeight: 600 }}>Failed to load dashboard</div>
      <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 4 }}>{error}</div>
      <button onClick={fetchAll} className="btn btn-primary" style={{ marginTop: 16 }}>Retry</button>
    </div>
  );

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#9ca3af' }}>
      <div style={{ width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading dashboard...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const { cars, leads, appointments, todayAppts, upcomingAppts, recentLeads, users } = data;
  const cpu = sysStats?.cpu?.usagePercent;
  const ram = sysStats?.ram?.usedPercent;

  return (
    <div style={{ padding: '4px 0 40px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0 }}>Dashboard</h2>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}` : 'Loading...'}
          </div>
        </div>
        <button onClick={fetchAll} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>
          ↻ Refresh
        </button>
      </div>

      {/* ── Visitors ── */}
      <SectionHeader title="Public Visitors" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <KpiCard icon="👁️" label="Today" value={visitors?.today ?? '—'} color="#6366f1" />
        <KpiCard icon="📅" label="Last 7 Days" value={visitors?.this_week ?? '—'} color="#3b82f6" />
        <KpiCard icon="📆" label="Last 30 Days" value={visitors?.this_month ?? '—'} color="#06b6d4" />
        <KpiCard icon="🌐" label="All Time" value={visitors?.total ?? '—'} color="#8b5cf6" />
      </div>

      {/* ── Cars ── */}
      <SectionHeader title="Inventory" action={
        <button onClick={() => onNavigate('cars')} style={{ fontSize: '0.78rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
      } />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <KpiCard icon="🚗" label="Total Cars" value={cars.total} color="#1e293b" onClick={() => onNavigate('cars')} />
        <KpiCard icon="✅" label="Available" value={cars.available} color="#10b981" onClick={() => onNavigate('cars')} />
        <KpiCard icon="🔖" label="Reserved" value={cars.reserved} color="#f59e0b" onClick={() => onNavigate('cars')} />
        <KpiCard icon="🏁" label="Sold" value={cars.sold} color="#6b7280" onClick={() => onNavigate('cars')} />
      </div>

      {/* ── Leads + Appointments row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 28 }}>

        {/* Leads */}
        <div>
          <SectionHeader title="Leads" action={
            <button onClick={() => onNavigate('leads')} style={{ fontSize: '0.78rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
          } />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <KpiCard icon="📋" label="Total" value={leads.total} color="#6366f1" onClick={() => onNavigate('leads')} />
            <KpiCard icon="🆕" label="New" value={leads.new_leads} color="#4f46e5" onClick={() => onNavigate('leads')} />
            <KpiCard icon="📞" label="Contacted" value={leads.contacted} color="#f59e0b" onClick={() => onNavigate('leads')} />
            <KpiCard icon="🔔" label="Follow-up Today" value={leads.followup_today}
              color={leads.followup_today > 0 ? '#ef4444' : '#9ca3af'}
              onClick={() => onNavigate('leads')} />
          </div>
        </div>

        {/* Appointments */}
        <div>
          <SectionHeader title="Appointments" action={
            <button onClick={() => onNavigate('appointments')} style={{ fontSize: '0.78rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
          } />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <KpiCard icon="📅" label="Today" value={appointments.today} color={appointments.today > 0 ? '#3b82f6' : '#9ca3af'} onClick={() => onNavigate('appointments')} />
            <KpiCard icon="🕐" label="Scheduled" value={appointments.scheduled} color="#3b82f6" onClick={() => onNavigate('appointments')} />
            <KpiCard icon="✔️" label="Completed" value={appointments.completed} color="#10b981" onClick={() => onNavigate('appointments')} />
            <KpiCard icon="❌" label="Cancelled" value={appointments.cancelled} color="#9ca3af" onClick={() => onNavigate('appointments')} />
          </div>
        </div>

      </div>

      {/* ── System + Users ── */}
      <SectionHeader title="System" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>

        {/* Users card */}
        <Panel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👥</div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Team</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{users.total}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: '#1e293b', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{users.admins}</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 1 }}>Admin</div>
            </div>
            <div style={{ flex: 1, background: '#eff6ff', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>{users.staff}</div>
              <div style={{ fontSize: '0.68rem', color: '#93c5fd', marginTop: 1 }}>Staff</div>
            </div>
          </div>
        </Panel>

        {/* System health */}
        {(cpu != null || ram != null) && (
          <Panel>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>System Health</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cpu != null && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>CPU</span>
                  </div>
                  <ProgressBar pct={cpu} color={cpu > 85 ? '#ef4444' : cpu > 60 ? '#f59e0b' : '#10b981'} />
                </div>
              )}
              {ram != null && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>RAM</span>
                  </div>
                  <ProgressBar pct={ram} color={ram > 85 ? '#ef4444' : ram > 60 ? '#f59e0b' : '#3b82f6'} />
                </div>
              )}
              <div style={{ paddingTop: 4, borderTop: '1px solid #f3f4f6', fontSize: '0.75rem', color: '#9ca3af' }}>
                Uptime {sysStats?.uptime ? Math.floor(sysStats.uptime.serverSeconds / 3600) + 'h ' + Math.floor((sysStats.uptime.serverSeconds % 3600) / 60) + 'm' : '—'}
              </div>
            </div>
          </Panel>
        )}
      </div>

      {/* ── Today's Appointments ── */}
      <SectionHeader title="Today's Appointments" />
      <Panel noPad>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['Time', 'Customer', 'Car', 'Status', 'Notes'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {todayAppts.length === 0
              ? <EmptyRow msg="No appointments scheduled for today" cols={5} />
              : todayAppts.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < todayAppts.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>{fmtTime(a.appointment_date)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={a.lead_name} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>{a.lead_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{a.lead_phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.85rem' }}>{a.car_model || '—'}</td>
                  <td style={{ padding: '12px 16px' }}><Badge status={a.status} /></td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '0.82rem' }}>{a.notes || '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Panel>

      {/* ── Upcoming Appointments ── */}
      <SectionHeader title="Upcoming Appointments" />
      <Panel noPad>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['Date & Time', 'Customer', 'Car', 'Notes'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {upcomingAppts.length === 0
              ? <EmptyRow msg="No upcoming appointments" cols={4} />
              : upcomingAppts.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < upcomingAppts.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>{fmtDate(a.appointment_date)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={a.lead_name} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>{a.lead_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{a.lead_phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.85rem' }}>{a.car_model || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '0.82rem' }}>{a.notes || '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Panel>

      {/* ── Recent Leads ── */}
      <SectionHeader title="Recent Leads" action={
        <button onClick={() => onNavigate('leads')} style={{ fontSize: '0.78rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
      } />
      <Panel noPad>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['Customer', 'Car Interest', 'Status', 'Created'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentLeads.length === 0
              ? <EmptyRow msg="No leads yet" cols={4} />
              : recentLeads.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={l.name} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>{l.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{l.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.85rem' }}>
                    {l.car_model ? `${l.car_model}${l.car_ref ? ` (${l.car_ref})` : ''}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}><Badge status={l.status} /></td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '0.82rem' }}>{fmtDate(l.created_at)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Panel>

    </div>
  );
}
