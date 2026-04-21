import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './public.css';

const LABEL = { '09:00': '9:00 AM', '10:00': '10:00 AM', '11:00': '11:00 AM', '12:00': '12:00 PM', '13:00': '1:00 PM', '14:00': '2:00 PM', '15:00': '3:00 PM', '16:00': '4:00 PM', '17:00': '5:00 PM' };
const ALL_SLOTS = Object.keys(LABEL);

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preCarId = searchParams.get('car_id') || '';

  const [car, setCar] = useState(null);
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState({ available: ALL_SLOTS, booked: [] });
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!preCarId) return;
    fetch('/api/cars')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const found = data.data.find(c => c.id === parseInt(preCarId));
          if (found) setCar(found);
        }
      });
  }, [preCarId]);

  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    fetch(`/api/appointments/available?date=${date}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setSlots(data.data);
      })
      .finally(() => setLoadingSlots(false));
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedSlot) return setError('Please select a time slot.');
    if (!/^01[0-9]{8,9}$/.test(form.phone)) return setError('Enter a valid Malaysian phone number (e.g. 0123456789).');

    const appointment_date = `${date}T${selectedSlot}:00`;
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, car_id: preCarId || undefined, appointment_date }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.message);
        // Refresh slots in case it was just taken
        if (res.status === 409) {
          fetch(`/api/appointments/available?date=${date}`)
            .then(r => r.json())
            .then(d => { if (d.success) setSlots(d.data); });
          setSelectedSlot('');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="pub-layout">
        <header className="pub-header">
          <div className="pub-header-inner">
            <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
          </div>
        </header>
        <main className="pub-main" style={{ maxWidth: 480, textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#1e2d3d', marginBottom: 8 }}>Appointment Booked!</h2>
          <p style={{ color: '#555' }}>
            We'll contact you at <strong>{form.phone}</strong> to confirm your visit on{' '}
            <strong>{new Date(`${date}T${selectedSlot}`).toLocaleString('en-MY', { dateStyle: 'full', timeStyle: 'short' })}</strong>.
          </p>
          <button className="btn-book" style={{ marginTop: 24 }} onClick={() => navigate('/')}>Back to Cars</button>
        </main>
      </div>
    );
  }

  return (
    <div className="pub-layout">
      <header className="pub-header">
        <div className="pub-header-inner">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
          <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '1rem' }}>Book a Visit</span>
        </div>
      </header>

      <main className="pub-main" style={{ maxWidth: 560 }}>
        <h2 style={{ color: '#1e2d3d', marginBottom: 4 }}>Schedule a Visit</h2>
        <p style={{ color: '#888', marginBottom: car ? 12 : 24, fontSize: '0.9rem' }}>Pick a date and time — each slot is 1 hour, first-come first-served.</p>

        {car && (
          <div style={{ background: '#eef3f7', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7a93a8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Interested in</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e2d3d' }}>{car.model}{car.year ? ` (${car.year})` : ''}</span>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: '#555' }}>
              {car.ref_no && <span>Ref: <strong>{car.ref_no}</strong></span>}
              <span>RM <strong>{car.price?.toLocaleString()}</strong></span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Date picker */}
          <div className="book-field">
            <label>Select Date</label>
            <input
              type="date"
              value={date}
              min={today()}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {/* Slot grid */}
          <div className="book-field">
            <label>Select Time {loadingSlots && <span style={{ color: '#aaa', fontWeight: 400 }}>(loading…)</span>}</label>
            <div className="slot-grid">
              {ALL_SLOTS.map(slot => {
                const taken = slots.booked.includes(slot);
                const active = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`slot-btn${taken ? ' taken' : active ? ' selected' : ''}`}
                    disabled={taken}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {LABEL[slot]}
                    {taken && <span className="slot-taken-label">Taken</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer details */}
          <div className="book-field">
            <label>Your Name</label>
            <input
              placeholder="e.g. Ahmad Razif"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="book-field">
            <label>Phone Number</label>
            <input
              placeholder="e.g. 0123456789"
              required
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
            <span className="book-hint">We'll use this to confirm your appointment.</span>
          </div>

          <div className="book-field">
            <label>Notes <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
            <textarea
              placeholder="Any specific car you're interested in, questions, etc."
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {error && <div className="book-error">{error}</div>}

          <button type="submit" className="btn-book" disabled={submitting}>
            {submitting ? 'Booking…' : 'Confirm Appointment'}
          </button>
        </form>
      </main>
    </div>
  );
}
