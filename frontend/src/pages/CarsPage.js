import React, { useState, useEffect, useRef } from 'react'; // React needed for React.Fragment
import { authFetch, getToken } from '../auth';

const API = '/api/cars';

function ImageGallery({ carId }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();

  const fetchImages = async () => {
    const res = await fetch(`${API}/${carId}/images`);
    const data = await res.json();
    if (data.success) setImages(data.data);
  };

  useEffect(() => { fetchImages(); }, [carId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    await fetch(`${API}/${carId}/images`, {
      method: 'POST', body: fd,
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    await fetchImages();
    setUploading(false);
    fileRef.current.value = '';
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Delete this image?')) return;
    await authFetch(`${API}/${carId}/images/${imageId}`, { method: 'DELETE' });
    fetchImages();
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {images.map(img => (
          <div key={img.id} style={{ position: 'relative' }}>
            <img
              src={`http://localhost:3000/uploads/${img.filename}`}
              alt="car"
              onClick={() => setLightbox(`http://localhost:3000/uploads/${img.filename}`)}
              style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: '2px solid #eee' }}
            />
            <button
              onClick={() => handleDelete(img.id)}
              style={{
                position: 'absolute', top: -6, right: -6,
                background: '#e94560', color: 'white', border: 'none',
                borderRadius: '50%', width: 18, height: 18, fontSize: 10,
                cursor: 'pointer', lineHeight: '18px', textAlign: 'center', padding: 0,
              }}>✕</button>
          </div>
        ))}
        <label style={{
          width: 80, height: 60, border: '2px dashed #ccc', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#aaa', fontSize: 22, flexShrink: 0,
        }}>
          {uploading ? '...' : '+'}
          <input type="file" accept="image/*" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}>
          <img src={lightbox} alt="preview" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({ model: '', price: '', mileage: '', condition: '' });
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchCars = async () => {
    const res = await fetch(API);
    const data = await res.json();
    if (data.success) setCars(data.data);
  };

  useEffect(() => { fetchCars(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await authFetch(API, {
      method: 'POST',
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setForm({ model: '', price: '', mileage: '', condition: '' });
      fetchCars();
    } else {
      setError(data.message);
    }
  };

  const updateStatus = async (id, status) => {
    await authFetch(`${API}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    fetchCars();
  };

  const statusClass = (s) => {
    if (s === 'available') return 'badge badge-available';
    if (s === 'sold') return 'badge badge-sold';
    return 'badge badge-reserved';
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div className="grid-2">
        <div className="card">
          <h2>Add Car</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input placeholder="Model (e.g. Toyota Vios 2020)" required
              value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
            <input type="number" placeholder="Price (RM)" required
              value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            <input type="number" placeholder="Mileage (km)"
              value={form.mileage} onChange={e => setForm({ ...form, mileage: e.target.value })} />
            <input placeholder="Condition (e.g. Good)"
              value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} />
            <button type="submit" className="btn btn-primary">Add Car</button>
          </form>
        </div>

        <div className="card">
          <h2>Car Inventory ({cars.length})</h2>
          <table>
            <thead>
              <tr><th>Model</th><th>Price</th><th>Mileage</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {cars.map(car => (
                <React.Fragment key={car.id}>
                  <tr
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === car.id ? null : car.id)}>
                    <td>{car.model}</td>
                    <td>RM{car.price?.toLocaleString()}</td>
                    <td>{car.mileage?.toLocaleString()} km</td>
                    <td><span className={statusClass(car.status)}>{car.status}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <select className="btn btn-sm btn-secondary"
                        value={car.status}
                        onChange={e => updateStatus(car.id, e.target.value)}>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                      </select>
                    </td>
                  </tr>
                  {expanded === car.id && (
                    <tr>
                      <td colSpan="5" style={{ background: '#fafafa', padding: '10px 16px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: 6 }}>
                          Photos — click + to upload, click photo to preview
                        </div>
                        <ImageGallery carId={car.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {cars.length === 0 && <tr><td colSpan="5" style={{textAlign:'center',color:'#aaa'}}>No cars yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
