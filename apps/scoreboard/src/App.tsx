import { Routes, Route, Navigate } from 'react-router-dom';
import { getDeviceToken } from './lib/device';
import { ActivatePage } from './pages/ActivatePage';
import { DisplayPage } from './pages/DisplayPage';

export default function App() {
  const activated = Boolean(getDeviceToken());

  return (
    <Routes>
      <Route path="/activate" element={<ActivatePage />} />
      <Route path="/display" element={activated ? <DisplayPage /> : <Navigate to="/activate" replace />} />
      <Route path="*" element={<Navigate to={activated ? '/display' : '/activate'} replace />} />
    </Routes>
  );
}
