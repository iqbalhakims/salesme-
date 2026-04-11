import React, { useState, useEffect, useRef } from 'react'; // React needed for React.Fragment

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
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append('image', file);
      await fetch(`${API}/${carId}/images`, { method: 'POST', body: fd });
    }
    await fetchImages();
    setUploading(false);
    fileRef.current.value = '';
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Delete this image?')) return;
    await fetch(`${API}/${carId}/images/${imageId}`, { method: 'DELETE' });
    fetchImages();
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {images.map(img => (
          <div key={img.id} style={{ position: 'relative' }}>
            <img
              src={`/uploads/${img.filename}`}
              alt="car"
              onClick={() => setLightbox(`/uploads/${img.filename}`)}
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
          <input type="file" accept="image/*" multiple ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}>
          <img src={lightbox} alt="preview" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8 }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function VideoGallery({ carId }) {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const fetchVideos = async () => {
    const res = await fetch(`${API}/${carId}/videos`);
    const data = await res.json();
    if (data.success) setVideos(data.data);
  };

  useEffect(() => { fetchVideos(); }, [carId]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('video', file);
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = async () => {
      await fetchVideos();
      setUploading(false);
      setProgress(0);
      fileRef.current.value = '';
    };
    xhr.open('POST', `${API}/${carId}/videos`);
    xhr.send(fd);
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Delete this video?')) return;
    await fetch(`${API}/${carId}/videos/${videoId}`, { method: 'DELETE' });
    fetchVideos();
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {videos.map(vid => (
          <div key={vid.id} style={{ position: 'relative', display: 'inline-block' }}>
            <video
              src={`/uploads/${vid.filename}`}
              controls
              style={{ width: '100%', maxWidth: 320, borderRadius: 6, border: '2px solid #eee' }}
            />
            <button
              onClick={() => handleDelete(vid.id)}
              style={{
                position: 'absolute', top: 4, right: 4,
                background: '#e94560', color: 'white', border: 'none',
                borderRadius: '50%', width: 22, height: 22, fontSize: 11,
                cursor: 'pointer', lineHeight: '22px', textAlign: 'center', padding: 0,
              }}>✕</button>
          </div>
        ))}
        <label style={{
          width: 120, border: '2px dashed #ccc', borderRadius: 6, padding: '8px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: uploading ? 'default' : 'pointer', color: '#aaa', fontSize: '0.85rem', gap: 6,
        }}>
          {uploading ? `Uploading ${progress}%` : '🎥 Add Video'}
          <input type="file" accept="video/*" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({ model: '', price: '', mileage: '', condition: '' });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
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
    setSubmitting(true);
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      const carId = data.data.id;
      for (const file of photos) {
        const fd = new FormData();
        fd.append('image', file);
        await fetch(`${API}/${carId}/images`, { method: 'POST', body: fd });
      }
      setForm({ model: '', price: '', mileage: '', condition: '' });
      setPhotos([]);
      fetchCars();
    } else {
      setError(data.message);
    }
    setSubmitting(false);
  };

  const deleteCar = async (id, model) => {
    if (!window.confirm(`Delete "${model}"? This cannot be undone.`)) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    fetchCars();
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
            <label style={{
              border: '2px dashed #ccc', borderRadius: 6, padding: '10px 12px',
              cursor: 'pointer', color: '#888', fontSize: '0.95rem', textAlign: 'center',
            }}>
              {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? 's' : ''} selected` : '📷 Add Photos (optional)'}
              <input type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files))} style={{ display: 'none' }} />
            </label>
            {photos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {photos.map((f, i) => (
                  <img key={i} src={URL.createObjectURL(f)} alt="preview"
                    style={{ width: 60, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                ))}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Car'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Car Inventory ({cars.length})</h2>
          <div style={{ overflowX: 'auto' }}><table>
            <thead>
              <tr><th>Model</th><th>Photos</th><th>Price</th><th>Mileage</th><th>Status</th><th>Action</th><th></th></tr>
            </thead>
            <tbody>
              {cars.map(car => (
                <React.Fragment key={car.id}>
                  <tr>
                    <td>{car.model}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setExpanded(expanded === car.id ? null : car.id)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {expanded === car.id ? '▲ Hide' : '📷 Photos'}
                      </button>
                    </td>
                    <td>RM{car.price?.toLocaleString()}</td>
                    <td>{car.mileage?.toLocaleString()} km</td>
                    <td><span className={statusClass(car.status)}>{car.status}</span></td>
                    <td>
                      <select className="btn btn-sm btn-secondary"
                        value={car.status}
                        onChange={e => updateStatus(car.id, e.target.value)}>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={() => deleteCar(car.id, car.model)}
                        style={{ background: '#fde8ec', color: '#c0392b', whiteSpace: 'nowrap' }}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                  {expanded === car.id && (
                    <tr>
                      <td colSpan="7" style={{ background: '#fafafa', padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: 6 }}>📷 Photos</div>
                        <ImageGallery carId={car.id} />
                        <div style={{ fontSize: '0.85rem', color: '#555', margin: '12px 0 6px' }}>🎥 Videos</div>
                        <VideoGallery carId={car.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {cars.length === 0 && <tr><td colSpan="7" style={{textAlign:'center',color:'#aaa'}}>No cars yet</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  );
}
