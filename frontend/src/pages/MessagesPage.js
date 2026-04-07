import { useState, useEffect } from 'react';
import { authFetch } from '../auth';

export default function MessagesPage() {
  const [cars, setCars] = useState([]);
  const [carId, setCarId] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/cars').then(r => r.json()).then(d => {
      if (d.success) setCars(d.data.filter(c => c.status === 'available'));
    });
  }, []);

  const generate = async () => {
    setError('');
    setMessage('');
    if (!carId) return setError('Please select a car');
    const res = await authFetch('/api/messages/generate', {
      method: 'POST',
      body: JSON.stringify({ car_id: carId }),
    });
    const data = await res.json();
    if (data.success) setMessage(data.message);
    else setError(data.message);
  };

  const copy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div className="card" style={{ maxWidth: 600 }}>
        <h2>WhatsApp Message Generator</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <select style={{ flex: 1 }} value={carId} onChange={e => setCarId(e.target.value)}>
            <option value="">-- Select a Car --</option>
            {cars.map(c => (
              <option key={c.id} value={c.id}>{c.model} — RM{c.price?.toLocaleString()}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={generate}>Generate</button>
        </div>

        {message && (
          <>
            <div className="message-box">{message}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn btn-secondary btn-sm copy-btn" onClick={copy}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={whatsapp}>
                📱 Share on WhatsApp
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
