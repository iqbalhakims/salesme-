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
            <h1 className="pub-brand">iqbalhakim</h1>
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
          href="https://wa.me/60134107845?text=Hi%2C%20I%27m%20interested%20in%20one%20of%20your%20cars"
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

function estimateMonthly(price) {
  if (!price) return null;
  const loan = price * 0.9;
  const total = loan + loan * 0.035 * 7;
  return Math.ceil(total / (7 * 12));
}

function CarCard({ car, onClick }) {
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    fetch(`/api/cars/${car.id}/images`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data.length) setThumb(d.data[0].filename); });
  }, [car.id]);

  const monthly = estimateMonthly(car.price);

  return (
    <div className="pub-card" onClick={onClick}>
      <div className="pub-card-img">
        {thumb
          ? <img src={`/uploads/${thumb}`} alt={car.model} />
          : <div className="pub-card-img-placeholder">🚗</div>
        }
      </div>
      <div className="pub-card-body">
        {monthly && <p className="pub-card-monthly">est. RM {monthly.toLocaleString()}/mo</p>}
        <p className="pub-card-price">RM {car.price?.toLocaleString()}</p>
        <h3 className="pub-card-title">{car.model}</h3>
        <div className="pub-card-meta">
          {car.year ? <span>📅 {car.year}</span> : null}
          {car.mileage ? <span>🛣 {car.mileage.toLocaleString()} km</span> : null}
          {car.condition ? <span>⚙️ {car.condition}</span> : null}
          {car.grade ? <span>🏷 {car.grade}</span> : null}
        </div>
      </div>
    </div>
  );
}
