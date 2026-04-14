import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './public.css';

function LoanCalculator({ carPrice, carModel, carYear, carRef }) {
  const [dp, setDp] = useState(Math.round(carPrice * 0.1));
  const [tenure, setTenure] = useState(7);
  const [ncd, setNcd] = useState(0);
  const [rate] = useState(3.5);

  const loanAmount = Math.max(0, carPrice - dp);
  const totalInterest = loanAmount * (rate / 100) * tenure;
  const totalPayable = loanAmount + totalInterest;
  const monthly = tenure > 0 ? totalPayable / (tenure * 12) : 0;

  // Rough insurance estimate (1.5% of car price) adjusted by NCD
  const baseInsurance = carPrice * 0.015;
  const insuranceAfterNcd = baseInsurance * (1 - ncd / 100);

  const waMsg = encodeURIComponent(
    `Hi, I'm interested in this car:\n` +
    `- Model: ${carModel}${carYear ? ` (${carYear})` : ''}\n` +
    `- Ref: ${carRef}\n` +
    `- Price: RM${carPrice?.toLocaleString()}\n\n` +
    `Based on my calculation:\n` +
    `- Down payment: RM${dp.toLocaleString()}\n` +
    `- Tenure: ${tenure} years\n` +
    `- Monthly installment: RM${Math.ceil(monthly).toLocaleString()}\n` +
    `Can you help me proceed?`
  );

  return (
    <div className="calc-wrap">
      <h3 className="calc-title">💰 Loan Calculator</h3>

      <div className="calc-fields">
        <div className="calc-field">
          <label>Down Payment (RM)</label>
          <input
            type="number"
            value={dp}
            min={0}
            max={carPrice}
            onChange={e => setDp(Number(e.target.value))}
          />
          <span className="calc-hint">{carPrice > 0 ? ((dp / carPrice) * 100).toFixed(0) : 0}% of car price</span>
        </div>

        <div className="calc-field">
          <label>Loan Tenure</label>
          <div className="tenure-btns">
            {[1, 3, 5, 7, 9].map(y => (
              <button
                key={y}
                className={tenure === y ? 'tenure-btn active' : 'tenure-btn'}
                onClick={() => setTenure(y)}
              >{y}yr</button>
            ))}
          </div>
        </div>

        <div className="calc-field">
          <label>NCD (%)</label>
          <div className="tenure-btns">
            {[0, 25, 30, 38.33, 45].map(n => (
              <button
                key={n}
                className={ncd === n ? 'tenure-btn active' : 'tenure-btn'}
                onClick={() => setNcd(n)}
              >{n}%</button>
            ))}
          </div>
        </div>
      </div>

      <div className="calc-result">
        <div className="calc-monthly">
          <span className="calc-monthly-label">Est. Monthly</span>
          <span className="calc-monthly-value">RM {Math.ceil(monthly).toLocaleString()}</span>
        </div>
        <div className="calc-breakdown">
          <div className="calc-row">
            <span>Loan amount</span>
            <span>RM {loanAmount.toLocaleString()}</span>
          </div>
          <div className="calc-row">
            <span>Interest ({rate}% flat × {tenure}yr)</span>
            <span>RM {Math.round(totalInterest).toLocaleString()}</span>
          </div>
          <div className="calc-row">
            <span>Total payable</span>
            <span>RM {Math.round(totalPayable).toLocaleString()}</span>
          </div>
          <div className="calc-row">
            <span>Est. insurance/yr {ncd > 0 ? `(${ncd}% NCD)` : ''}</span>
            <span>RM {Math.round(insuranceAfterNcd).toLocaleString()}</span>
          </div>
        </div>
        <p className="calc-disclaimer">* Estimate only. Actual rate subject to bank approval.</p>
        <a href={`https://wa.me/60134107845?text=${waMsg}`} target="_blank" rel="noreferrer" className="wa-cta-btn">
          💬 WhatsApp with This Calculation
        </a>
      </div>
    </div>
  );
}

export default function CarDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [images, setImages] = useState([]);
  const [dents, setDents] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/cars`).then(r => r.json()),
      fetch(`/api/cars/${id}/images`).then(r => r.json()),
      fetch(`/api/cars/${id}/dents`).then(r => r.json()),
    ]).then(([carsData, imagesData, dentsData]) => {
      if (carsData.success) {
        const found = carsData.data.find(c => c.id === parseInt(id));
        setCar(found || null);
      }
      if (imagesData.success) setImages(imagesData.data);
      if (dentsData.success) setDents(dentsData.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="pub-layout"><p className="pub-empty">Loading...</p></div>;
  if (!car) return <div className="pub-layout"><p className="pub-empty">Car not found.</p></div>;

  return (
    <div className="pub-layout">
      <header className="pub-header">
        <div className="pub-header-inner">
          <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
          <button className="admin-btn" onClick={() => navigate('/admin')}>⚙️ Admin</button>
        </div>
      </header>

      <main className="pub-main">
        <div className="detail-wrap">
          {/* Gallery */}
          <div className="detail-gallery">
            <div className="detail-main-img" onClick={() => images.length > 0 && setLightbox(true)} style={{ cursor: images.length > 0 ? 'zoom-in' : 'default' }}>
              {images.length > 0
                ? <img src={`/uploads/${images[active].filename}`} alt={car.model} />
                : <div className="pub-card-img-placeholder large">🚗</div>
              }
            </div>
            {images.length > 1 && (
              <div className="detail-thumbs">
                {images.map((img, i) => (
                  <img
                    key={img.id}
                    src={`/uploads/${img.filename}`}
                    alt=""
                    className={i === active ? 'thumb active' : 'thumb'}
                    onClick={() => setActive(i)}
                  />
                ))}
              </div>
            )}

            {lightbox && (
              <div className="lightbox-overlay" onClick={() => setLightbox(false)}>
                <button className="lightbox-close" onClick={() => setLightbox(false)}>✕</button>
                <img
                  src={`/uploads/${images[active].filename}`}
                  alt={car.model}
                  className="lightbox-img"
                  onClick={e => e.stopPropagation()}
                />
                {images.length > 1 && (
                  <>
                    <button className="lightbox-prev" onClick={e => { e.stopPropagation(); setActive(i => (i - 1 + images.length) % images.length); }}>‹</button>
                    <button className="lightbox-next" onClick={e => { e.stopPropagation(); setActive(i => (i + 1) % images.length); }}>›</button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="detail-info">
            <h2 className="detail-title">{car.model}</h2>
            <p className="detail-price">RM {car.price?.toLocaleString()}</p>

            <div className="detail-specs">
              {car.ref_no && (
                <div className="spec-row">
                  <span className="spec-label">Ref No</span>
                  <span className="spec-value">{car.ref_no}</span>
                </div>
              )}
              {car.year && (
                <div className="spec-row">
                  <span className="spec-label">Year</span>
                  <span className="spec-value">{car.year}</span>
                </div>
              )}
              {car.grade && (
                <div className="spec-row">
                  <span className="spec-label">Grade</span>
                  <span className="spec-value">{car.grade}</span>
                </div>
              )}
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
                <span className="spec-value" style={{ color: '#3a8c6e', fontWeight: 700 }}>Available</span>
              </div>
            </div>

            <div className="detail-perks">
              <span>✅ Full loan can arrange</span>
              <span>✅ Low deposit</span>
              <span>✅ Viewing available</span>
            </div>

          </div>
        </div>

        {/* Dents & Scratches */}
        {dents.length > 0 && (
          <div className="dent-section">
            <h3 className="dent-title">🔧 Dents & Scratches</h3>
            <div className="dent-grid">
              {dents.map(d => (
                <div key={d.id} className="dent-item">
                  {d.filename && <img src={`/uploads/${d.filename}`} alt="dent" className="dent-img" />}
                  {d.note && <p className="dent-note">{d.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loan Calculator — full width below */}
        <div className="calc-section">
          <LoanCalculator
            key={car.id}
            carPrice={car.price || 0}
            carModel={car.model}
            carYear={car.year}
            carRef={car.ref_no || `REF-${String(car.id).padStart(4, '0')}`}
          />
        </div>
      </main>
    </div>
  );
}
