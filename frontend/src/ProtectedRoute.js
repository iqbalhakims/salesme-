import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getToken, clearToken } from './auth';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking'); // checking | ok | denied

  useEffect(() => {
    const token = getToken();
    if (!token) { setStatus('denied'); return; }

    fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setStatus(d.success ? 'ok' : 'denied'))
      .catch(() => setStatus('denied'));
  }, []);

  if (status === 'checking') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
        <p style={{ color: '#888' }}>Verifying session...</p>
      </div>
    );
  }

  if (status === 'denied') {
    clearToken();
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
