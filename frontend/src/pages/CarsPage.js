import React, { useState, useEffect, useRef } from 'react'; // React needed for React.Fragment

const API = '/api/cars';

function resizeImage(file, maxPx = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);
    img.onerror = () => { cleanup(); resolve(file); }; // fallback: upload original
    img.onload = () => {
      cleanup();
      let { width, height } = img;
      if (width <= maxPx && height <= maxPx) { resolve(file); return; }
      if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
      else { width = Math.round(width * maxPx / height); height = maxPx; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
        'image/jpeg', quality
      );
    };
    img.src = url;
  });
}

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
    try {
      const resized = await Promise.all(files.map(f => resizeImage(f)));
      let failed = 0;
      for (const file of resized) {
        const fd = new FormData();
        fd.append('image', file);
        const r = await fetch(`${API}/${carId}/images`, { method: 'POST', body: fd }).then(r => r.json());
        if (!r.success) failed++;
      }
      if (failed) alert(`${failed} image(s) failed to upload`);
      await fetchImages();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
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

function DentGallery({ carId }) {
  const [dents, setDents] = useState([]);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const fetchDents = async () => {
    const res = await fetch(`${API}/${carId}/dents`);
    const data = await res.json();
    if (data.success) setDents(data.data);
  };

  useEffect(() => { fetchDents(); }, [carId]);

  const handleSubmit = async () => {
    const file = fileRef.current.files[0];
    if (!file && !note.trim()) return;
    setUploading(true);
    const fd = new FormData();
    if (file) {
      const resized = await resizeImage(file);
      fd.append('image', resized);
    }
    fd.append('note', note);
    await fetch(`${API}/${carId}/dents`, { method: 'POST', body: fd });
    setNote('');
    fileRef.current.value = '';
    await fetchDents();
    setUploading(false);
  };

  const handleDelete = async (dentId) => {
    if (!window.confirm('Delete this dent/scratch?')) return;
    await fetch(`${API}/${carId}/dents/${dentId}`, { method: 'DELETE' });
    fetchDents();
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input
          placeholder="Note (e.g. bumper scratch)"
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{ flex: 1, minWidth: 140, padding: '5px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem' }}
        />
        <label style={{
          border: '2px dashed #ccc', borderRadius: 6, padding: '5px 10px',
          cursor: 'pointer', color: '#aaa', fontSize: '0.82rem', display: 'flex', alignItems: 'center',
        }}>
          📷 Photo
          <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} />
        </label>
        <button className="btn btn-sm btn-secondary" onClick={handleSubmit} disabled={uploading}>
          {uploading ? '...' : '+ Add'}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {dents.map(d => (
          <div key={d.id} style={{ position: 'relative', background: '#fff8f0', border: '1px solid #f0d9c0', borderRadius: 8, padding: 6, maxWidth: 120 }}>
            {d.filename && (
              <img src={`/uploads/${d.filename}`} alt="dent"
                style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4, display: 'block', marginBottom: 4 }} />
            )}
            {d.note && <div style={{ fontSize: '0.72rem', color: '#a06030' }}>{d.note}</div>}
            <button onClick={() => handleDelete(d.id)} style={{
              position: 'absolute', top: -6, right: -6,
              background: '#e94560', color: 'white', border: 'none',
              borderRadius: '50%', width: 18, height: 18, fontSize: 10,
              cursor: 'pointer', lineHeight: '18px', textAlign: 'center', padding: 0,
            }}>✕</button>
          </div>
        ))}
        {dents.length === 0 && <span style={{ fontSize: '0.8rem', color: '#bbb' }}>No dents recorded</span>}
      </div>
    </div>
  );
}

function VideoGallery({ carId }) {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
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
    setDone(false);
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
      setDone(true);
      fileRef.current.value = '';
      setTimeout(() => setDone(false), 3000);
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
      {done && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#e6f9ee', color: '#1a7a4a', border: '1px solid #a3e4bc',
          borderRadius: 8, padding: '6px 12px', marginBottom: 10, fontSize: '0.88rem', fontWeight: 600,
        }}>
          ✅ Video uploaded successfully!
        </div>
      )}
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
          width: 140, border: '2px dashed #ccc', borderRadius: 6, padding: '8px 12px',
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
  const [form, setForm] = useState({ ref_no: '', model: '', price: '', mileage: '', condition: '', year: '', grade: '' });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [expandedDents, setExpandedDents] = useState(null);
  const [expandedVideos, setExpandedVideos] = useState(null);
  const [editing, setEditing] = useState(null); // car id being edited
  const [editForm, setEditForm] = useState({});
  const [modelSearch, setModelSearch] = useState('');
  const filteredCars = cars.filter(c => c.model?.toLowerCase().includes(modelSearch.toLowerCase()));

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
      if (photos.length) {
        const resized = await Promise.all(photos.map(f => resizeImage(f)));
        for (const file of resized) {
          const fd = new FormData();
          fd.append('image', file);
          await fetch(`${API}/${carId}/images`, { method: 'POST', body: fd });
        }
      }
      setForm({ ref_no: '', model: '', price: '', mileage: '', condition: '', year: '', grade: '' });
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

  const startEdit = (car) => {
    setEditing(car.id);
    setEditForm({ ref_no: car.ref_no || '', model: car.model || '', price: car.price || '', mileage: car.mileage || '', condition: car.condition || '', year: car.year || '', grade: car.grade || '' });
  };

  const cancelEdit = () => { setEditing(null); setEditForm({}); };

  const saveEdit = async (id) => {
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (data.success) { cancelEdit(); fetchCars(); }
    else alert(data.message);
  };

  const shareOnWhatsApp = (car) => {
    const lines = [
      `🚗 *${car.model}*`,
      car.ref_no ? `Ref: ${car.ref_no}` : null,
      car.year ? `Year: ${car.year}` : null,
      car.mileage ? `Mileage: ${car.mileage.toLocaleString()} km` : null,
      car.condition ? `Condition: ${car.condition}` : null,
      car.grade ? `Grade: ${car.grade}` : null,
      `Price: RM${car.price?.toLocaleString()}`,
      `Status: ${car.status}`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
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
            <input placeholder="Ref No (e.g. 1234)" required
              value={form.ref_no} onChange={e => setForm({ ...form, ref_no: e.target.value })} />
            <input placeholder="Model (e.g. Toyota Vios 2020)" required
              value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
            <input type="number" placeholder="Price (RM)" required
              value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            <input type="number" placeholder="Mileage (km)"
              value={form.mileage} onChange={e => setForm({ ...form, mileage: e.target.value })} />
            <input placeholder="Condition (e.g. Good)"
              value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} />
            <input type="number" placeholder="Year (e.g. 2020)"
              value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            <input placeholder="Grade (e.g. A, B+)"
              value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Car Inventory ({filteredCars.length}{filteredCars.length !== cars.length ? ` of ${cars.length}` : ''})</h2>
            <input
              placeholder="🔍 Filter by model..."
              value={modelSearch}
              onChange={e => setModelSearch(e.target.value)}
              style={{ padding: '7px 14px', border: '1px solid #ddd', borderRadius: 20, fontSize: '0.9rem', outline: 'none', minWidth: 200 }}
            />
          </div>
          <div className="table-wrap"><table>
            <thead>
              <tr><th>Ref</th><th>Model</th><th>Photos</th><th>Videos</th><th>Dents</th><th>Price</th><th>Mileage</th><th>Status</th><th>Action</th><th></th><th></th></tr>
            </thead>
            <tbody>
              {filteredCars.map(car => (
                <React.Fragment key={car.id}>
                  <tr>
                    <td style={{ color: '#888', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{car.ref_no || '—'}</td>
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
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setExpandedVideos(expandedVideos === car.id ? null : car.id)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {expandedVideos === car.id ? '▲ Hide' : '🎥 Videos'}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setExpandedDents(expandedDents === car.id ? null : car.id)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {expandedDents === car.id ? '▲ Hide' : '🔧 Dents'}
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
                        onClick={() => editing === car.id ? cancelEdit() : startEdit(car)}
                        style={{ background: '#e8f0fe', color: '#1a56db', whiteSpace: 'nowrap' }}
                      >
                        {editing === car.id ? '✕ Cancel' : '✏️ Edit'}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={() => shareOnWhatsApp(car)}
                        style={{ background: '#e6f9ee', color: '#25d366', whiteSpace: 'nowrap' }}
                      >
                        📲 Share
                      </button>
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
                  {editing === car.id && (
                    <tr>
                      <td colSpan="11" style={{ background: '#f0f4ff', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                          <input placeholder="Ref No" value={editForm.ref_no} onChange={e => setEditForm({ ...editForm, ref_no: e.target.value })} style={{ flex: '1 1 90px' }} />
                          <input placeholder="Model" value={editForm.model} onChange={e => setEditForm({ ...editForm, model: e.target.value })} style={{ flex: '2 1 180px' }} />
                          <input type="number" placeholder="Price" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={{ flex: '1 1 100px' }} />
                          <input type="number" placeholder="Mileage" value={editForm.mileage} onChange={e => setEditForm({ ...editForm, mileage: e.target.value })} style={{ flex: '1 1 100px' }} />
                          <input placeholder="Condition" value={editForm.condition} onChange={e => setEditForm({ ...editForm, condition: e.target.value })} style={{ flex: '1 1 100px' }} />
                          <input type="number" placeholder="Year" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })} style={{ flex: '1 1 80px' }} />
                          <input placeholder="Grade" value={editForm.grade} onChange={e => setEditForm({ ...editForm, grade: e.target.value })} style={{ flex: '1 1 80px' }} />
                          <button className="btn btn-primary btn-sm" onClick={() => saveEdit(car.id)}>💾 Save</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {expanded === car.id && (
                    <tr>
                      <td colSpan="11" style={{ background: '#fafafa', padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: 6 }}>📷 Photos</div>
                        <ImageGallery carId={car.id} />
                      </td>
                    </tr>
                  )}
                  {expandedVideos === car.id && (
                    <tr>
                      <td colSpan="11" style={{ background: '#f0f7ff', padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: 6 }}>🎥 Videos</div>
                        <VideoGallery carId={car.id} />
                      </td>
                    </tr>
                  )}
                  {expandedDents === car.id && (
                    <tr>
                      <td colSpan="11" style={{ background: '#fff8f0', padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: 6 }}>🔧 Dents & Scratches</div>
                        <DentGallery carId={car.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {cars.length === 0 && <tr><td colSpan="11" style={{textAlign:'center',color:'#aaa'}}>No cars yet</td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  );
}
