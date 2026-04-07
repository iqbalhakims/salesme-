import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/public/HomePage';
import CarDetailPage from './pages/public/CarDetailPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/cars/:id" element={<CarDetailPage />} />

        {/* Auth */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Protected admin */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
