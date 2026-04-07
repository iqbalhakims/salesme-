import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../auth';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        navigate('/admin');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Server error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.logo}>🚗</div>
        <h1 style={styles.title}>Car Sales CRM</h1>
        <p style={styles.sub}>Admin Login</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter username"
              autoFocus
              required
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button style={loading ? { ...styles.btn, opacity: 0.7 } : styles.btn} disabled={loading}>
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>

        <p style={styles.hint}>
          Default: <code>admin</code> / <code>admin123</code>
        </p>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: 'white', borderRadius: 16, padding: '40px 36px',
    width: '100%', maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  logo: { fontSize: '2.5rem', marginBottom: 8 },
  title: { margin: '0 0 4px', fontSize: '1.4rem', color: '#1a1a2e' },
  sub: { margin: '0 0 28px', color: '#888', fontSize: '0.9rem' },
  error: {
    background: '#fde8ec', color: '#c0392b', border: '1px solid #f5c6cb',
    borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.9rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#555' },
  input: {
    padding: '11px 14px', border: '1px solid #ddd', borderRadius: 8,
    fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s',
  },
  btn: {
    marginTop: 4, padding: '12px', background: '#e94560', color: 'white',
    border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer', transition: 'background 0.2s',
  },
  hint: { marginTop: 20, color: '#aaa', fontSize: '0.78rem' },
};
