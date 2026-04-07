import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './public.css';

export default function HomePage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/cars')
      .then(r => r.json())
      .then(d => {
        if (d.success) setCars(d.data.filter(c => c.status === 'available'));
        setLoading(false);
      });
  }, []);

  const filtered = cars.filter(c =>
    c.model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pub-layout">
      <header className="pub-header">
        <div className="pub-header-inner">
          <div>
            <h1 className="pub-brand">🚗 ReconCars</h1>
            <p className="pub-tagline">Quality recon cars — best price guaranteed</p>
          </div>
          <button className="admin-btn" onClick={() => navigate('/admin')}>
            ⚙️ Admin
          </button>
        </div>
      </header>

      <main className="pub-main">
        <div className="pub-search-wrap">
          <input
            className="pub-search"
            placeholder="🔍  Search by model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="pub-empty">Loading cars...</p>}

        {!loading && filtered.length === 0 && (
          <p className="pub-empty">No available cars right now. Check back soon!</p>
        )}

        <div className="pub-grid">
          {filtered.map(car => (
            <CarCard key={car.id} car={car} onClick={() => navigate(`/cars/${car.id}`)} />
          ))}
        </div>
      </main>

      <footer className="pub-footer">
        <p>Interested? Chat with us directly on WhatsApp 👇</p>
        <a
          href="https://wa.me/60123456789?text=Hi%2C%20I%27m%20interested%20in%20one%20of%20your%20cars"
          target="_blank"
          rel="noreferrer"
          className="wa-float-btn"
        >
          💬 WhatsApp Us
        </a>
      </footer>
    </div>
  );
}

function CarCard({ car, onClick }) {
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    fetch(`/api/cars/${car.id}/images`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data.length) setThumb(d.data[0].filename); });
  }, [car.id]);

  return (
    <div className="pub-card" onClick={onClick}>
      <div className="pub-card-img">
        {thumb
          ? <img src={`http://localhost:3000/uploads/${thumb}`} alt={car.model} />
          : <div className="pub-card-img-placeholder">🚗</div>
        }
      </div>
      <div className="pub-card-body">
        <h3 className="pub-card-title">{car.model}</h3>
        <p className="pub-card-price">RM {car.price?.toLocaleString()}</p>
        <p className="pub-card-meta">{car.mileage?.toLocaleString()} km &nbsp;·&nbsp; {car.condition || 'N/A'}</p>
        <span className="pub-badge">Available</span>
      </div>
    </div>
  );
}
