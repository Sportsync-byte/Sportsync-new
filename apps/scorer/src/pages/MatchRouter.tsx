import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@sportsync/api-client';
import { ScoringPage } from './ScoringPage';
import { NetballScoringPage } from './NetballScoringPage';
import { FootballScoringPage } from './FootballScoringPage';

export function MatchRouter() {
  const { matchId } = useParams<{ matchId: string }>();
  const [sport, setSport] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    api.matches.get(matchId).then((doc) => {
      const match = doc as { sport?: string };
      setSport(match.sport || 'indoor-cricket');
    });
  }, [matchId]);

  if (!sport) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading match...</div>;
  if (sport === 'indoor-netball') return <NetballScoringPage />;
  if (sport === 'indoor-football') return <FootballScoringPage />;
  return <ScoringPage />;
}
