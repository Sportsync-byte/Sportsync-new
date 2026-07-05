import { useEffect, useState } from 'react';
import { api } from '@sportsync/api-client';
import type { Venue } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';

export function VenueSettingsPage() {
  const { venue, refreshVenues } = useVenue();
  const [form, setForm] = useState<Partial<Venue['branding'] & { name: string }>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (venue) {
      setForm({
        name: venue.name,
        primaryColor: venue.branding.primaryColor,
        secondaryColor: venue.branding.secondaryColor,
        logoUrl: venue.branding.logoUrl,
        sponsorBannerUrl: venue.branding.sponsorBannerUrl,
      });
    }
  }, [venue]);

  if (!venue) return null;

  const save = async () => {
    await api.venues.update(venue.id, {
      name: form.name,
      branding: {
        primaryColor: form.primaryColor || '#00c896',
        secondaryColor: form.secondaryColor || '#1a2332',
        logoUrl: form.logoUrl,
        sponsorBannerUrl: form.sponsorBannerUrl,
      },
    });
    await refreshVenues();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Venue Settings</h1>

      <div className="card" style={{ maxWidth: 480 }}>
        <label style={labelStyle}>Venue Name</label>
        <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />

        <label style={labelStyle}>Primary Colour</label>
        <input type="color" value={form.primaryColor || '#00c896'} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} style={{ ...inputStyle, height: 48, padding: 4 }} />

        <label style={labelStyle}>Secondary Colour</label>
        <input type="color" value={form.secondaryColor || '#1a2332'} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} style={{ ...inputStyle, height: 48, padding: 4 }} />

        <label style={labelStyle}>Logo URL</label>
        <input value={form.logoUrl || ''} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} style={inputStyle} placeholder="https://..." />

        <label style={labelStyle}>Sponsor Banner URL</label>
        <input value={form.sponsorBannerUrl || ''} onChange={(e) => setForm({ ...form, sponsorBannerUrl: e.target.value })} style={inputStyle} placeholder="https://..." />

        <button className="primary" onClick={save} style={{ marginTop: '1.5rem' }}>
          {saved ? 'Saved!' : 'Save Branding'}
        </button>
      </div>

      <div className="card" style={{ marginTop: '1.5rem', maxWidth: 480 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Scoreboard Preview</div>
        <div style={{ background: form.secondaryColor, padding: '1.5rem', borderRadius: 12, borderTop: `4px solid ${form.primaryColor}` }}>
          {form.logoUrl && <img src={form.logoUrl} alt="Logo" style={{ height: 40, marginBottom: '0.75rem' }} />}
          <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700 }}>{form.name}</div>
          <div style={{ color: form.primaryColor, fontSize: '2.5rem', fontWeight: 900, marginTop: '0.5rem' }}>42/3</div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', marginTop: '0.75rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' };
