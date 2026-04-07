import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CarsPage from './CarsPage';
import LeadsPage from './LeadsPage';
import MessagesPage from './MessagesPage';
import { clearToken } from '../auth';
import '../index.css';

export default function AdminPage() {
  const [page, setPage] = useState('cars');
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/admin/login');
  };

  return (
    <div>
      <nav>
        <h1>🚗 Car Sales CRM</h1>
        <button className={page === 'cars' ? 'active' : ''} onClick={() => setPage('cars')}>Cars</button>
        <button className={page === 'leads' ? 'active' : ''} onClick={() => setPage('leads')}>Leads</button>
        <button className={page === 'messages' ? 'active' : ''} onClick={() => setPage('messages')}>Messages</button>
        <button
          onClick={() => navigate('/')}
          style={{ marginLeft: 'auto', background: '#27ae60', color: 'white', borderRadius: 6, padding: '4px 14px', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          🌐 View Site
        </button>
        <button
          onClick={handleLogout}
          style={{ background: 'transparent', color: '#aaa', border: '1px solid #444', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          Logout
        </button>
      </nav>
      <div className="container">
        {page === 'cars' && <CarsPage />}
        {page === 'leads' && <LeadsPage />}
        {page === 'messages' && <MessagesPage />}
      </div>
    </div>
  );
}
