import { Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardHome } from './pages/DashboardHome';
import { CompetitionsPage } from './pages/CompetitionsPage';
import { CompetitionDetailPage } from './pages/CompetitionDetailPage';
import { TeamsPage } from './pages/TeamsPage';
import { PlayersPage } from './pages/PlayersPage';
import { LiveScoresPage } from './pages/LiveScoresPage';
import { MultiCourtLivePage } from './pages/MultiCourtLivePage';
import { ScoreboardsPage } from './pages/ScoreboardsPage';
import { CourtsPage } from './pages/CourtsPage';
import { VenueSettingsPage } from './pages/VenueSettingsPage';

import { PlayerProfilePage } from './pages/PlayerProfilePage';
import { PublicPlayerSearchPage } from './pages/PublicPlayerSearchPage';

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 700 }}>SportSync</span>
        <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Player Profiles</span>
      </header>
      <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>{children}</main>
    </div>
  );
}

function ProtectedRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/competitions" element={<CompetitionsPage />} />
        <Route path="/competitions/:competitionId" element={<CompetitionDetailPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/players/search" element={<PublicPlayerSearchPage />} />
        <Route path="/players/:playerId" element={<PlayerProfilePage />} />
        <Route path="/p/:slug" element={<PlayerProfilePage />} />
        <Route path="/live" element={<LiveScoresPage />} />
        <Route path="/courts/live" element={<MultiCourtLivePage />} />
        <Route path="/courts" element={<CourtsPage />} />
        <Route path="/scoreboards" element={<ScoreboardsPage />} />
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
        <Route path="/players/search" element={<PublicLayout><PublicPlayerSearchPage /></PublicLayout>} />
        <Route path="/players/:playerId" element={<PublicLayout><PlayerProfilePage /></PublicLayout>} />
        <Route path="/p/:slug" element={<PublicLayout><PlayerProfilePage /></PublicLayout>} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return <ProtectedRoutes />;
}
