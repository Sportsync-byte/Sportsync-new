import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
    </Routes>
  );
}
