import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './public.css';

export default function CarDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [images, setImages] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/cars`).then(r => r.json()),
      fetch(`/api/cars/${id}/images`).then(r => r.json()),
    ]).then(([carsData, imagesData]) => {
      if (carsData.success) {
        const found = carsData.data.find(c => c.id === parseInt(id));
        setCar(found || null);
      }
      if (imagesData.success) setImages(imagesData.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="pub-layout"><p className="pub-empty">Loading...</p></div>;
  if (!car) return <div className="pub-layout"><p className="pub-empty">Car not found.</p></div>;

  const waMsg = encodeURIComponent(`Hi, I'm interested in the ${car.model} (RM${car.price?.toLocaleString()}). Is it still available?`);

  return (
    <div className="pub-layout">
      <header className="pub-header">
        <div className="pub-header-inner">
          <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
          <button className="admin-btn" onClick={() => navigate('/admin')}>⚙️ Admin</button>
        </div>
      </header>

      <main className="pub-main detail-wrap">
        {/* Gallery */}
        <div className="detail-gallery">
          <div className="detail-main-img">
            {images.length > 0
              ? <img src={`http://localhost:3000/uploads/${images[active].filename}`} alt={car.model} />
              : <div className="pub-card-img-placeholder large">🚗</div>
            }
          </div>
          {images.length > 1 && (
            <div className="detail-thumbs">
              {images.map((img, i) => (
                <img
                  key={img.id}
                  src={`http://localhost:3000/uploads/${img.filename}`}
                  alt=""
                  className={i === active ? 'thumb active' : 'thumb'}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="detail-info">
          <h2 className="detail-title">{car.model}</h2>
          <p className="detail-price">RM {car.price?.toLocaleString()}</p>

          <div className="detail-specs">
            <div className="spec-row">
              <span className="spec-label">Mileage</span>
              <span className="spec-value">{car.mileage?.toLocaleString()} km</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Condition</span>
              <span className="spec-value">{car.condition || '—'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Status</span>
              <span className="spec-value" style={{ color: '#27ae60', fontWeight: 700 }}>Available</span>
            </div>
          </div>

          <div className="detail-perks">
            <span>✅ Full loan can arrange</span>
            <span>✅ Low deposit</span>
            <span>✅ Viewing available</span>
          </div>

          <a
            href={`https://wa.me/60123456789?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            className="wa-cta-btn"
          >
            💬 WhatsApp to Enquire
          </a>
        </div>
      </main>
    </div>
  );
}
