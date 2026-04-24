import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../auth';

/* ─── constants ──────────────────────────────────────────────────────────── */
const AWS = {
  dark:      '#232f3e',
  orange:    '#ec7211',
  blue:      '#0073bb',
  border:    '#d5dbdb',
  bg:        '#f2f3f3',
  text:      '#16191f',
  textSub:   '#687078',
  white:     '#ffffff',
  rowHover:  '#f8f8f8',
};

const STATUS_META = {
  scheduled:  { color: '#0073bb', bg: '#e6f2f8', dot: '#0073bb' },
  completed:  { color: '#1d8348', bg: '#e8f5e9', dot: '#1d8348' },
  cancelled:  { color: '#b03a2e', bg: '#fdecea', dot: '#b03a2e' },
  new:        { color: '#1a5276', bg: '#eaf2f8', dot: '#1a5276' },
  contacted:  { color: '#7d6608', bg: '#fef9e7', dot: '#f1c40f' },
  follow_up:  { color: '#784212', bg: '#fef5e7', dot: '#e67e22' },
  closed:     { color: '#1d8348', bg: '#e8f5e9', dot: '#1d8348' },
  available:  { color: '#1d8348', bg: '#e8f5e9', dot: '#1d8348' },
  sold:       { color: '#566573', bg: '#f2f3f4', dot: '#aab7b8' },
  reserved:   { color: '#7d6608', bg: '#fef9e7', dot: '#f1c40f' },
};

/* ─── helpers ────────────────────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/* ─── primitives ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const m = STATUS_META[status] || { color: '#566573', bg: '#f2f3f4', dot: '#aab7b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 2, background: m.bg, color: m.color, fontSize: '0.75rem', fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {status?.replace('_', ' ')}
    </span>
  );
}

function Avatar({ name }) {
  const letters = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const palette = ['#1a5276','#117a65','#784212','#6c3483','#1f618d','#0e6655'];
  const bg = palette[(name || '').charCodeAt(0) % palette.length];
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>
      {letters}
    </div>
  );
}

/* Widget = AWS-style white panel with title bar */
function Widget({ title, action, children, minWidth }) {
  return (
    <div style={{ background: AWS.white, border: `1px solid ${AWS.border}`, borderRadius: 3, overflow: 'hidden', minWidth: minWidth || 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${AWS.border}`, background: '#fafafa' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: AWS.text }}>{title}</span>
        {action && <span style={{ fontSize: '0.8rem', color: AWS.blue, cursor: 'pointer' }}>{action}</span>}
      </div>
      {children}
    </div>
  );
}

/* Single metric inside a widget */
function Metric({ label, value, color, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: '14px 16px', borderBottom: `1px solid ${AWS.border}`, cursor: onClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = AWS.rowHover; }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: color || AWS.text, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.78rem', color: AWS.textSub, marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* Grid of metrics in a widget */
function MetricGrid({ metrics, cols = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {metrics.map((m, i) => (
        <div key={i} onClick={m.onClick} style={{
          padding: '14px 16px',
          borderRight: (i + 1) % cols !== 0 ? `1px solid ${AWS.border}` : 'none',
          borderBottom: i < metrics.length - cols ? `1px solid ${AWS.border}` : 'none',
          cursor: m.onClick ? 'pointer' : 'default',
          transition: 'background 0.1s',
        }}
          onMouseEnter={e => { if (m.onClick) e.currentTarget.style.background = AWS.rowHover; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: m.color || AWS.text, lineHeight: 1 }}>{m.value ?? '—'}</div>
          <div style={{ fontSize: '0.75rem', color: AWS.textSub, marginTop: 4 }}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}

function AwsTable({ headers, rows, emptyMsg }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: `1px solid ${AWS.border}` }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: AWS.textSub, fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={headers.length} style={{ padding: '20px 16px', color: AWS.textSub, textAlign: 'center', fontSize: '0.83rem' }}>{emptyMsg}</td></tr>
            : rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid #f2f3f4` }}
                onMouseEnter={e => e.currentTarget.style.background = AWS.rowHover}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '8px 16px', color: AWS.text, verticalAlign: 'middle' }}>{cell}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressBar({ label, pct }) {
  const color = pct > 85 ? '#b03a2e' : pct > 60 ? '#ec7211' : '#1d8348';
  return (
    <div style={{ padding: '10px 16px', borderBottom: `1px solid ${AWS.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.8rem', color: AWS.text, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{pct != null ? `${pct}%` : '—'}</span>
      </div>
      <div style={{ height: 4, background: '#e8eaed', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct || 0, 100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

/* ─── main ───────────────────────────────────────────────────────────────── */
export default function DashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [sys, setSys] = useState(null);
  const [visitors, setVisitors] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [dashRes, sysRes, visRes] = await Promise.all([
        authFetch('/api/dashboard/stats'),
        authFetch('/api/system/stats'),
        authFetch('/api/visitors/stats'),
      ]);
      if (!dashRes.ok) throw new Error('Failed to load dashboard');
      const dash = await dashRes.json();
      setData(dash.data);
      if (sysRes.ok) setSys(await sysRes.json());
      if (visRes.ok) { const v = await visRes.json(); setVisitors(v.data); }
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  if (error) return (
    <div style={{ margin: '32px 0', padding: '14px 16px', background: '#fdecea', border: `1px solid #e74c3c`, borderRadius: 3, fontSize: '0.88rem', color: '#b03a2e', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '1.1rem' }}>⚠</span>
      <span><strong>Error:</strong> {error}</span>
      <button onClick={fetchAll} style={{ marginLeft: 'auto', background: '#b03a2e', color: '#fff', border: 'none', borderRadius: 3, padding: '5px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>Retry</button>
    </div>
  );

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0', color: AWS.textSub, fontSize: '0.88rem' }}>
      <div style={{ width: 16, height: 16, border: `2px solid ${AWS.border}`, borderTopColor: AWS.orange, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const { cars, leads, appointments, todayAppts, upcomingAppts, recentLeads, users } = data;
  const uptime = sys?.uptime ? `${Math.floor(sys.uptime.serverSeconds / 3600)}h ${Math.floor((sys.uptime.serverSeconds % 3600) / 60)}m` : '—';

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── Breadcrumb / page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: AWS.textSub, marginBottom: 2 }}>
            <span style={{ color: AWS.blue, cursor: 'pointer' }}>Home</span> &gt; Dashboard
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: AWS.text }}>Dashboard</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: AWS.textSub }}>
              Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          )}
          <button onClick={fetchAll} disabled={refreshing} style={{
            background: AWS.white, border: `1px solid ${AWS.border}`, borderRadius: 3,
            padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', color: AWS.text,
            fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
            Refresh
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      {/* ── Row 1: Visitors ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: AWS.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Public Site Visitors</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Today', value: visitors?.today, color: AWS.orange },
            { label: 'Last 7 days', value: visitors?.this_week, color: '#8e44ad' },
            { label: 'Last 30 days', value: visitors?.this_month, color: AWS.blue },
            { label: 'All time', value: visitors?.total, color: AWS.text },
          ].map(m => (
            <div key={m.label} style={{ background: AWS.white, border: `1px solid ${AWS.border}`, borderRadius: 3, padding: '16px 18px', borderTop: `3px solid ${m.color}` }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value ?? '—'}</div>
              <div style={{ fontSize: '0.78rem', color: AWS.textSub, marginTop: 6 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 2: Inventory + Leads + Appointments ── */}
      <div style={{ marginTop: 20, marginBottom: 8 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: AWS.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Operations Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

          <Widget title="Inventory" action={<span onClick={() => onNavigate('cars')}>View all cars →</span>}>
            <MetricGrid cols={2} metrics={[
              { label: 'Total cars', value: cars.total, onClick: () => onNavigate('cars') },
              { label: 'Available', value: cars.available, color: '#1d8348', onClick: () => onNavigate('cars') },
              { label: 'Reserved', value: cars.reserved, color: '#7d6608', onClick: () => onNavigate('cars') },
              { label: 'Sold', value: cars.sold, color: AWS.textSub, onClick: () => onNavigate('cars') },
            ]} />
          </Widget>

          <Widget title="Leads" action={<span onClick={() => onNavigate('leads')}>View all leads →</span>}>
            <MetricGrid cols={2} metrics={[
              { label: 'Total', value: leads.total, onClick: () => onNavigate('leads') },
              { label: 'New', value: leads.new_leads, color: '#1a5276', onClick: () => onNavigate('leads') },
              { label: 'Contacted', value: leads.contacted, color: '#7d6608', onClick: () => onNavigate('leads') },
              { label: 'Follow-up today', value: leads.followup_today, color: leads.followup_today > 0 ? '#b03a2e' : AWS.textSub, onClick: () => onNavigate('leads') },
            ]} />
          </Widget>

          <Widget title="Appointments" action={<span onClick={() => onNavigate('appointments')}>View all →</span>}>
            <MetricGrid cols={2} metrics={[
              { label: 'Today', value: appointments.today, color: appointments.today > 0 ? AWS.blue : AWS.text, onClick: () => onNavigate('appointments') },
              { label: 'Scheduled', value: appointments.scheduled, color: AWS.blue, onClick: () => onNavigate('appointments') },
              { label: 'Completed', value: appointments.completed, color: '#1d8348', onClick: () => onNavigate('appointments') },
              { label: 'Cancelled', value: appointments.cancelled, color: AWS.textSub, onClick: () => onNavigate('appointments') },
            ]} />
          </Widget>

        </div>
      </div>

      {/* ── Row 3: System health + Team ── */}
      <div style={{ marginTop: 20, marginBottom: 8 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: AWS.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>System & Account</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          <Widget title="System Health">
            <ProgressBar label="CPU utilization" pct={sys?.cpu?.usagePercent} />
            <ProgressBar label="Memory utilization" pct={sys?.ram?.usedPercent} />
            <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Uptime', value: uptime },
                { label: 'Storage', value: sys?.storage ? `${sys.storage.usedMB} MB` : '—' },
                { label: 'Files', value: sys?.storage?.fileCount ?? '—' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: AWS.text }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', color: AWS.textSub, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Widget>

          <Widget title="Account" action={<span onClick={() => onNavigate('users')}>Manage users →</span>}>
            <Metric label="Total users" value={users.total} onClick={() => onNavigate('users')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${AWS.border}` }}>
              <div style={{ padding: '14px 16px', borderRight: `1px solid ${AWS.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: AWS.dark }}>{users.admins}</div>
                <div style={{ fontSize: '0.72rem', color: AWS.textSub, marginTop: 2 }}>Admin</div>
              </div>
              <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: AWS.blue }}>{users.staff}</div>
                <div style={{ fontSize: '0.72rem', color: AWS.textSub, marginTop: 2 }}>Staff</div>
              </div>
            </div>
          </Widget>

        </div>
      </div>

      {/* ── Row 4: Today's appointments ── */}
      <div style={{ marginTop: 20 }}>
        <Widget title={`Today's Appointments (${todayAppts.length})`}>
          <AwsTable
            headers={['Time', 'Customer', 'Phone', 'Car', 'Status', 'Notes']}
            emptyMsg="No appointments scheduled for today"
            rows={todayAppts.map(a => [
              <span style={{ fontWeight: 600, color: AWS.text }}>{fmtTime(a.appointment_date)}</span>,
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={a.lead_name} /><span style={{ fontWeight: 500 }}>{a.lead_name}</span></div>,
              <span style={{ color: AWS.textSub }}>{a.lead_phone}</span>,
              a.car_model || '—',
              <StatusBadge status={a.status} />,
              <span style={{ color: AWS.textSub, fontSize: '0.8rem' }}>{a.notes || '—'}</span>,
            ])}
          />
        </Widget>
      </div>

      {/* ── Row 5: Upcoming + Recent Leads side by side ── */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        <Widget title="Upcoming Appointments" action={<span onClick={() => onNavigate('appointments')}>View all →</span>}>
          <AwsTable
            headers={['Date', 'Customer', 'Car']}
            emptyMsg="No upcoming appointments"
            rows={upcomingAppts.map(a => [
              <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtDate(a.appointment_date)}</span>,
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={a.lead_name} /><span>{a.lead_name}</span></div>,
              a.car_model || '—',
            ])}
          />
        </Widget>

        <Widget title="Recent Leads" action={<span onClick={() => onNavigate('leads')}>View all →</span>}>
          <AwsTable
            headers={['Customer', 'Car interest', 'Status']}
            emptyMsg="No leads yet"
            rows={recentLeads.map(l => [
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={l.name} /><div><div style={{ fontWeight: 500 }}>{l.name}</div><div style={{ fontSize: '0.72rem', color: AWS.textSub }}>{l.phone}</div></div></div>,
              <span style={{ color: AWS.textSub, fontSize: '0.82rem' }}>{l.car_model || '—'}</span>,
              <StatusBadge status={l.status} />,
            ])}
          />
        </Widget>

      </div>

    </div>
  );
}
