import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './public.css';

const ABOUT = {
  name: 'Edaran Idaman Suri Sdn Bhd',
  description: 'Your trusted used car dealer in Alor Star, Kedah. We offer quality selling record cars with full loan arrangement, low deposit, and transparent pricing — serving buyers across Peninsular Malaysia.',
  location: 'Alor Star, Kedah, Malaysia',
  phone: '0134107845',
  mapSrc: 'https://maps.google.com/maps?q=39X6%2B6W+Alor+Setar,+Kedah&output=embed',
};

const PAGE_SIZE = 6;

export default function HomePage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState({ make: '', model: '', minPrice: '', maxPrice: '', minYear: '', maxYear: '', maxMileage: '', condition: '' });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const aboutRef = useRef(null);

  useEffect(() => {
    fetch('/api/cars')
      .then(r => r.json())
      .then(d => {
        if (d.success) setCars(d.data.filter(c => c.status === 'available'));
        setLoading(false);
      });
  }, []);

  // Derived filter options from data
  const makes = useMemo(() => {
    const set = new Set(cars.map(c => c.model?.split(' ')[0]).filter(Boolean));
    return [...set].sort();
  }, [cars]);

  const models = useMemo(() => {
    const set = new Set(cars.map(c => c.model).filter(Boolean));
    return [...set].sort();
  }, [cars]);

  const conditions = useMemo(() => {
    const set = new Set(cars.map(c => c.condition).filter(Boolean));
    return [...set].sort();
  }, [cars]);

  const filtered = useMemo(() => {
    let result = cars.filter(c => {
      if (search && !c.model.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.make && !c.model.toLowerCase().startsWith(filters.make.toLowerCase())) return false;
      if (filters.model && c.model !== filters.model) return false;
      if (filters.minPrice && c.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && c.price > Number(filters.maxPrice)) return false;
      if (filters.minYear && c.year < Number(filters.minYear)) return false;
      if (filters.maxYear && c.year > Number(filters.maxYear)) return false;
      if (filters.maxMileage && c.mileage > Number(filters.maxMileage)) return false;
      if (filters.condition && c.condition !== filters.condition) return false;
      return true;
    });

    if (sort === 'price_asc')  result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') result = [...result].sort((a, b) => b.price - a.price);
    if (sort === 'newest')     result = [...result].sort((a, b) => b.id - a.id);
    if (sort === 'mileage')    result = [...result].sort((a, b) => (a.mileage || 0) - (b.mileage || 0));

    result = [...result].sort((a, b) => (b.year >= 2024 ? 1 : 0) - (a.year >= 2024 ? 1 : 0));

    return result;
  }, [cars, search, filters, sort]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => { setPage(1); }, [search, filters, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const clearFilters = () => {
    setFilters({ make: '', model: '', minPrice: '', maxPrice: '', minYear: '', maxYear: '', maxMileage: '', condition: '' });
    setSearch('');
  };

  return (
    <div className="pub-layout">
      <header className="pub-header">
        <div className="pub-header-inner">
          <h1 className="pub-brand">iqbalhakim</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="about-btn" onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })}>About Us</button>
            <button className="admin-btn" onClick={() => navigate('/admin')}>⚙️ Admin</button>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div className="pub-hero">
        <div className="pub-hero-inner">
          <h2 className="pub-hero-title">8 Years Warranty</h2>
          <p className="pub-hero-sub">Unlimited Mileage · Every Car We Sell</p>
          <div className="pub-hero-perks">
            <span>💳 Low Deposit</span>
            <span>🏦 Full Loan Arrangement</span>
            <span>🇲🇾 Nationwide Delivery</span>
          </div>
        </div>
      </div>

      <main className="pub-main">
        {/* Search + Sort bar */}
        <div className="pub-toolbar">
          <input
            className="pub-search"
            placeholder="🔍  Search by model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="pub-sort" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="mileage">Lowest Mileage</option>
          </select>
          <button
            className={`pub-filter-btn${hasActiveFilters ? ' active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            ⚙ Filters{hasActiveFilters ? ' •' : ''}
          </button>
        </div>

        {/* Quick filter buttons */}
        <div className="pub-quick-filters">
          <button
            className={`pub-quick-btn${search === 'Alphard' ? ' active' : ''}`}
            onClick={() => setSearch(s => s === 'Alphard' ? '' : 'Alphard')}
          >
            Toyota Alphard
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="pub-filter-panel">
            <div className="pub-filter-grid">
              <div className="pub-filter-field">
                <label>Make</label>
                <select value={filters.make} onChange={e => setFilters({ ...filters, make: e.target.value, model: '' })}>
                  <option value="">All</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="pub-filter-field">
                <label>Model</label>
                <select value={filters.model} onChange={e => setFilters({ ...filters, model: e.target.value })}>
                  <option value="">All</option>
                  {models.filter(m => !filters.make || m.toLowerCase().startsWith(filters.make.toLowerCase())).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="pub-filter-field">
                <label>Min Price (RM)</label>
                <input type="number" placeholder="e.g. 30000" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
              </div>
              <div className="pub-filter-field">
                <label>Max Price (RM)</label>
                <input type="number" placeholder="e.g. 80000" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
              </div>
              <div className="pub-filter-field">
                <label>Min Year</label>
                <input type="number" placeholder="e.g. 2018" value={filters.minYear} onChange={e => setFilters({ ...filters, minYear: e.target.value })} />
              </div>
              <div className="pub-filter-field">
                <label>Max Year</label>
                <input type="number" placeholder="e.g. 2024" value={filters.maxYear} onChange={e => setFilters({ ...filters, maxYear: e.target.value })} />
              </div>
              <div className="pub-filter-field">
                <label>Max Mileage (km)</label>
                <input type="number" placeholder="e.g. 80000" value={filters.maxMileage} onChange={e => setFilters({ ...filters, maxMileage: e.target.value })} />
              </div>
              <div className="pub-filter-field">
                <label>Condition</label>
                <select value={filters.condition} onChange={e => setFilters({ ...filters, condition: e.target.value })}>
                  <option value="">All</option>
                  {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button className="pub-clear-btn" onClick={clearFilters}>✕ Clear filters</button>
            )}
          </div>
        )}

        {/* Count indicator */}
        {!loading && (
          <p className="pub-count">
            {filtered.length === cars.length
              ? `Showing all ${cars.length} cars`
              : `${filtered.length} of ${cars.length} cars`}
            {totalPages > 1 && ` — page ${page} of ${totalPages}`}
          </p>
        )}

        {loading && <p className="pub-empty">Loading cars...</p>}

        {!loading && filtered.length === 0 && (
          <p className="pub-empty">No cars match your filters. <button className="pub-link-btn" onClick={clearFilters}>Clear filters</button></p>
        )}

        <div className="pub-grid">
          {paginated.map(car => (
            <CarCard key={car.id} car={car} onClick={() => navigate(`/cars/${car.id}`)} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pub-pagination">
            <button className="pub-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`pub-page-btn${p === page ? ' active' : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button className="pub-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </main>

      <section ref={aboutRef} className="about-section">
        <div className="about-inner">
          <div className="about-info">
            <h2 className="about-name">{ABOUT.name}</h2>
            <p className="about-desc">{ABOUT.description}</p>
            <div className="about-details">
              <div className="about-row">
                <span className="about-icon">📍</span>
                <span>{ABOUT.location}</span>
              </div>
              <div className="about-row">
                <span className="about-icon">📞</span>
                <a href={`tel:+60${ABOUT.phone.replace(/^0/, '')}`} className="about-link">{ABOUT.phone}</a>
              </div>
              <div className="about-row">
                <span className="about-icon">💬</span>
                <a
                  href={`https://wa.me/60${ABOUT.phone.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="about-link"
                >WhatsApp Us</a>
              </div>
            </div>
          </div>
          <div className="about-map">
            <iframe
              title="Location"
              src={ABOUT.mapSrc}
              width="100%"
              height="260"
              style={{ border: 0, borderRadius: 12 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

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
        <div className="pub-footer-copy">
          © {new Date().getFullYear()} {ABOUT.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function estimateMonthly(price) {
  if (!price) return null;
  const loan = price * 0.9;
  const total = loan + loan * 0.026 * 7;
  return Math.ceil(total / (7 * 12));
}

function CarCard({ car, onClick }) {
  const [thumb, setThumb] = useState(null);
  const [video, setVideo] = useState(null);
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch(`/api/cars/${car.id}/images`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data.length) setThumb(d.data[0].filename); });
    fetch(`/api/cars/${car.id}/videos`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data.length) setVideo(d.data[0].filename); });
  }, [car.id]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (hovered) videoRef.current.play();
    else { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  }, [hovered]);

  const monthly = estimateMonthly(car.price);
  const isNew = car.year >= 2024;

  return (
    <div
      className={`pub-card${isNew ? ' pub-card--new' : ''}`}
      onClick={onClick}
      onMouseEnter={() => video && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="pub-card-img">
        {video && (
          <video
            ref={videoRef}
            src={`/uploads/${video}`}
            muted
            loop
            playsInline
            style={{ display: hovered ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {!hovered && (thumb
          ? <img src={`/uploads/${thumb}`} alt={car.model} />
          : <div className="pub-card-img-placeholder">🚗</div>
        )}
        {isNew && <span className="new-car-badge">NEW</span>}
      </div>
      <div className="pub-card-warranty">🛡️ 8 Years Warranty · Unlimited Mileage</div>
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
