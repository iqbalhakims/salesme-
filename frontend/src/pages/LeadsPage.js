import { useState, useEffect } from 'react';
import { authFetch } from '../auth';

const API_LEADS = '/api/leads';
const API_CARS = '/api/cars';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', car_id: '', next_follow_up_date: '' });
  const [error, setError] = useState('');

  const fetchAll = async () => {
    const [lRes, cRes] = await Promise.all([authFetch(API_LEADS), fetch(API_CARS)]);
    const [lData, cData] = await Promise.all([lRes.json(), cRes.json()]);
    if (lData.success) setLeads(lData.data);
    if (cData.success) setCars(cData.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await authFetch(API_LEADS, {
      method: 'POST',
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setForm({ name: '', phone: '', car_id: '', next_follow_up_date: '' });
      fetchAll();
    } else {
      setError(data.message);
    }
  };

  const updateLead = async (id, status) => {
    await authFetch(`${API_LEADS}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div className="grid-2">
        <div className="card">
          <h2>Add Lead</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input placeholder="Customer Name" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Phone (e.g. 0123456789)" required
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <select value={form.car_id} onChange={e => setForm({ ...form, car_id: e.target.value })}>
              <option value="">-- Select Car (optional) --</option>
              {cars.filter(c => c.status === 'available').map(c => (
                <option key={c.id} value={c.id}>{c.model} — RM{c.price?.toLocaleString()}</option>
              ))}
            </select>
            <input type="date" placeholder="Next Follow-Up Date"
              value={form.next_follow_up_date}
              onChange={e => setForm({ ...form, next_follow_up_date: e.target.value })} />
            <button type="submit" className="btn btn-primary">Add Lead</button>
          </form>
        </div>

        <div className="card">
          <h2>Leads ({leads.length})</h2>
          <table>
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Car</th><th>Follow-Up</th><th>Status</th></tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.car_model || '—'}</td>
                  <td>{lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toLocaleDateString() : '—'}</td>
                  <td>
                    <select className="btn btn-sm btn-secondary"
                      value={lead.status}
                      onChange={e => updateLead(lead.id, e.target.value)}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan="5" style={{textAlign:'center',color:'#aaa'}}>No leads yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
