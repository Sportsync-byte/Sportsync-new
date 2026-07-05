import { useEffect, useRef, useState } from 'react';
import type { IndoorCricketMatchState } from '@sportsync/shared';
import { getScoreboardDisplay, detectCricketFlashEvent } from '@sportsync/sport-rules';
import { formatTimer } from '../lib/siren';

export interface IndoorCricketBoardLabels {
  venueName?: string;
  logoUrl?: string;
  sponsorBannerUrl?: string;
  teamNames: Record<string, string>;
  playerNames: Record<string, string>;
  primaryColor?: string;
  secondaryColor?: string;
}

interface IndoorCricketPublicBoardProps {
  state: IndoorCricketMatchState;
  labels: IndoorCricketBoardLabels;
}

export function IndoorCricketPublicBoard({ state, labels }: IndoorCricketPublicBoardProps) {
  const display = getScoreboardDisplay(state);
  const batting = display.battingTeam;
  const bowling = display.bowlingTeam;
  const primary = labels.primaryColor || '#00d4aa';
  const secondary = labels.secondaryColor || '#141b24';
  const [flash, setFlash] = useState<string | null>(null);
  const lastBallId = useRef<string | null>(null);

  useEffect(() => {
    const innings = state.innings[state.battingTeamIndex];
    const last = innings.ballHistory[innings.ballHistory.length - 1];
    if (!last || last.id === lastBallId.current) return;
    lastBallId.current = last.id;
    const event = detectCricketFlashEvent(state);
    if (!event) return;
    setFlash(event.text);
    const timer = window.setTimeout(() => setFlash(null), event.durationSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [state]);

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#8b9cb3',
    fontWeight: 700,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${secondary} 0%, #0a0e12 100%)`,
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {flash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0,0,0,0.55)',
            zIndex: 20,
            animation: 'pulse 0.6s ease-in-out infinite alternate',
          }}
        >
          <div style={{ fontSize: 'clamp(3rem, 12vw, 8rem)', fontWeight: 900, color: primary, textShadow: `0 0 40px ${primary}` }}>
            {flash}
          </div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 1280 }}>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          {labels.logoUrl && <img src={labels.logoUrl} alt="" style={{ height: 40, marginBottom: '0.5rem' }} />}
          <div style={sectionLabel}>{labels.venueName || 'SportSync Live'}</div>
        </div>

        <div
          style={{
            aspectRatio: '8 / 5',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '38.3% 23.4% 38.3%',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16,
            border: `1px solid ${primary}33`,
            padding: '0.75rem',
          }}
        >
          {/* Left — runs & target */}
          <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto 1fr', gap: '0.5rem' }}>
            <div style={sectionLabel}>Runs</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#aeb9c8' }}>{labels.teamNames[batting.teamId] || 'Batting'}</div>
              <div style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 900, lineHeight: 1, color: primary }}>
                {batting.total}/{batting.wickets}
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#8b9cb3' }}>
                Skin {display.current.partnership}: {display.current.skinRuns}/{display.current.skinWickets}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                {labels.playerNames[display.current.strikerId] || '—'} *
              </div>
              <div style={{ fontSize: '0.85rem' }}>{labels.playerNames[display.current.nonStrikerId] || '—'}</div>
            </div>
            <div style={sectionLabel}>Target</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#aeb9c8' }}>{labels.teamNames[bowling.teamId] || 'Bowling'}</div>
              <div style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800 }}>{bowling.total}/{bowling.wickets}</div>
              {display.target != null ? (
                <>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#8b9cb3' }}>Target</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: primary }}>{display.target}</div>
                  {display.runsRequired != null && (
                    <div style={{ fontSize: '0.9rem', color: '#aeb9c8', marginTop: '0.25rem' }}>
                      Need {display.runsRequired} to win
                    </div>
                  )}
                </>
              ) : (
                <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#8b9cb3' }}>1st innings</div>
              )}
            </div>
          </div>

          {/* Center — over & timer */}
          <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: '0.5rem' }}>
            <div style={sectionLabel}>Over</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900 }}>
                {display.current.over}.{display.current.ball}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#8b9cb3' }}>Bowler</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{labels.playerNames[display.current.bowlerId] || '—'}</div>
              {display.format.powerplaysPerInnings > 0 && (
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#aeb9c8' }}>
                  Powerplays: {display.format.powerplaysPerInnings} per innings
                </div>
              )}
            </div>
            <div
              style={{
                background: display.current.timerExpired ? 'rgba(255,71,87,0.15)' : 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                padding: '1rem',
                textAlign: 'center',
                border: `2px solid ${display.current.timerExpired ? '#ff4757' : primary}`,
              }}
            >
              <div style={sectionLabel}>Timer</div>
              <div style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: display.current.timerExpired ? '#ff4757' : primary }}>
                {formatTimer(display.current.timerSeconds)}
              </div>
            </div>
            {labels.sponsorBannerUrl && (
              <img src={labels.sponsorBannerUrl} alt="Sponsor" style={{ width: '100%', maxHeight: 80, objectFit: 'contain' }} />
            )}
          </div>

          {/* Right — skins */}
          <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: '0.5rem' }}>
            <div style={sectionLabel}>Skins ({display.format.oversPerSkin} overs each)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflow: 'auto' }}>
              {display.skins.map((skin) => (
                <div
                  key={skin.skin}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: '0.75rem',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 8,
                    background:
                      skin.status === 'active'
                        ? `${primary}22`
                        : skin.status === 'complete'
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255,255,255,0.02)',
                    border: skin.status === 'active' ? `1px solid ${primary}66` : '1px solid transparent',
                  }}
                >
                  <div style={{ fontWeight: 800, color: skin.status === 'active' ? primary : '#8b9cb3' }}>S{skin.skin}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8b9cb3' }}>
                    Overs {(skin.skin - 1) * display.format.oversPerSkin}–{skin.skin * display.format.oversPerSkin - 1}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {skin.runs}/{skin.wickets}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {state.status === 'completed' && (
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '1.25rem', color: primary, fontWeight: 800 }}>
            Match Complete
            {state.winnerTeamId ? ` — ${labels.teamNames[state.winnerTeamId] || 'Winner'} wins` : ' — Tied'}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          from { opacity: 0.85; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
