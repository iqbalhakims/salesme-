import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CarsPage from './CarsPage';
import LeadsPage from './LeadsPage';
import MessagesPage from './MessagesPage';
import SystemPage from './SystemPage';
import { clearToken } from '../auth';
import '../index.css';

export default function AdminPage() {
  const [page, setPage] = useState('cars');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/admin/login');
  };

  const navTo = (p) => { setPage(p); setMenuOpen(false); };

  return (
    <div>
      <nav className="admin-nav">
        <h1>🚗 Car Sales CRM</h1>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {menuOpen ? '✕' : '☰'}
        </button>
        <div className={`nav-links${menuOpen ? ' open' : ''}`}>
          <button className={page === 'cars' ? 'active' : ''} onClick={() => navTo('cars')}>Cars</button>
          <button className={page === 'leads' ? 'active' : ''} onClick={() => navTo('leads')}>Leads</button>
          <button className={page === 'messages' ? 'active' : ''} onClick={() => navTo('messages')}>Messages</button>
          <button className={page === 'system' ? 'active' : ''} onClick={() => navTo('system')}>System</button>
          <button onClick={() => { navigate('/'); setMenuOpen(false); }} className="nav-util">🌐 View Site</button>
          <button onClick={handleLogout} className="nav-util nav-logout">Logout</button>
        </div>
      </nav>
      <div className="container">
        {page === 'cars' && <CarsPage />}
        {page === 'leads' && <LeadsPage />}
        {page === 'messages' && <MessagesPage />}
        {page === 'system' && <SystemPage />}
      </div>
    </div>
  );
}
