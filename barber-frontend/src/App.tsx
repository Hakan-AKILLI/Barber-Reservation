import { Routes, Route } from 'react-router-dom';
import BookingPage from './pages/customer/BookingPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminWorkingHours from './pages/admin/AdminWorkingHours';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminSettings from './pages/admin/AdminSettings';
export default function App() {
  return (
    <Routes>
      {/* Müşteri Randevu Sayfası */}
      <Route path="/:slug" element={<BookingPage />} />

      {/* Berber Yönetim Paneli */}
      <Route path="/:slug/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="working-hours" element={<AdminWorkingHours />} />
        <Route path="calendar" element={<AdminCalendar />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}