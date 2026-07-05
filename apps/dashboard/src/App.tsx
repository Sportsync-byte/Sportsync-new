import { Routes, Route, NavLink } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardHome } from './pages/DashboardHome';
import { CompetitionsPage } from './pages/CompetitionsPage';
import { LiveScoresPage } from './pages/LiveScoresPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/competitions" element={<CompetitionsPage />} />
        <Route path="/live" element={<LiveScoresPage />} />
        <Route path="*" element={<DashboardHome />} />
      </Routes>
    </Layout>
  );
}

export { NavLink };
