import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardHome } from './pages/DashboardHome';
import { CompetitionsPage } from './pages/CompetitionsPage';
import { CompetitionDetailPage } from './pages/CompetitionDetailPage';
import { TeamsPage } from './pages/TeamsPage';
import { PlayersPage } from './pages/PlayersPage';
import { LiveScoresPage } from './pages/LiveScoresPage';
import { VenueSettingsPage } from './pages/VenueSettingsPage';

function ProtectedRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/competitions" element={<CompetitionsPage />} />
        <Route path="/competitions/:competitionId" element={<CompetitionDetailPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/live" element={<LiveScoresPage />} />
        <Route path="/settings" element={<VenueSettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return <ProtectedRoutes />;
}
