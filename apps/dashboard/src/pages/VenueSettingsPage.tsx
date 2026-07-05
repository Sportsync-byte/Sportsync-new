import { useEffect, useState } from 'react';
import { api } from '@sportsync/api-client';
import type { Venue } from '@sportsync/shared';
import { useVenue } from '../context/VenueContext';
import { useSearchParams } from 'react-router-dom';

export function VenueSettingsPage() {
  const { venue, refreshVenues } = useVenue();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<Partial<Venue['branding'] & { name: string }>>({});
  const [saved, setSaved] = useState(false);
  const [billing, setBilling] = useState<{ billingStatus: string; stripeConfigured: boolean } | null>(null);
  const [smsStatus, setSmsStatus] = useState<{ configured: boolean; enabled: boolean; error?: string } | null>(null);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [autoSms, setAutoSms] = useState(false);
  const [reminderHours, setReminderHours] = useState(24);
  const [upgrading, setUpgrading] = useState(false);
  const billingNotice = searchParams.get('billing');

  useEffect(() => {
    if (venue) {
      setForm({
        name: venue.name,
        primaryColor: venue.branding.primaryColor,
        secondaryColor: venue.branding.secondaryColor,
        logoUrl: venue.branding.logoUrl,
        sponsorBannerUrl: venue.branding.sponsorBannerUrl,
      });
      api.billing.status(venue.id).then(setBilling).catch(() => setBilling(null));
      api.notifications.smsStatus(venue.id).then(setSmsStatus).catch(() => setSmsStatus(null));
      setSmsEnabled(venue.smsEnabled ?? false);
      setAutoSms(venue.smsAutoRemindersEnabled ?? false);
      setReminderHours(venue.smsReminderHoursBefore ?? 24);
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

  const upgrade = async () => {
    setUpgrading(true);
    try {
      const { url } = await api.billing.checkout(venue.id);
      if (url) window.location.href = url;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  const saveSmsSettings = async () => {
    if (!venue) return;
    await api.venues.update(venue.id, {
      smsAutoRemindersEnabled: autoSms,
      smsReminderHoursBefore: reminderHours,
    });
    await refreshVenues();
  };

  const toggleSms = async () => {
    if (!venue) return;
    const next = !smsEnabled;
    await api.venues.update(venue.id, { smsEnabled: next });
    setSmsEnabled(next);
    await refreshVenues();
    api.notifications.smsStatus(venue.id).then(setSmsStatus);
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Venue Settings</h1>

      {billingNotice === 'success' && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--accent)' }}>
          Subscription activated — welcome to Stadium tier!
        </div>
      )}

      {venue && (
        <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 480 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subscription</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', textTransform: 'capitalize', marginTop: '0.25rem' }}>
            {venue.productTier} tier
            {billing?.billingStatus && billing.billingStatus !== 'none' && (
              <span style={{ fontWeight: 400, fontSize: '0.85rem', marginLeft: '0.5rem', color: 'var(--text-muted)' }}>
                ({billing.billingStatus})
              </span>
            )}
          </div>
          {venue.subscription && (
            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <li>Up to {venue.subscription.maxCourts} courts</li>
              <li>{venue.subscription.maxSports} sport(s)</li>
              <li>{venue.subscription.maxCompetitions} active competitions</li>
              <li>{venue.subscription.advancedReporting ? 'PDF & CSV export enabled' : 'Export requires Stadium tier'}</li>
              <li>{venue.subscription.smsNotifications ? 'SMS notifications available' : 'SMS requires Stadium tier'}</li>
              <li>{venue.subscription.maxScoreboards} scoreboard licence(s) included</li>
            </ul>
          )}
          {venue.productTier === 'club' && billing?.stripeConfigured && (
            <button className="primary" style={{ marginTop: '1rem' }} onClick={upgrade} disabled={upgrading}>
              {upgrading ? 'Redirecting…' : 'Upgrade to Stadium'}
            </button>
          )}
          {venue.productTier === 'club' && billing && !billing.stripeConfigured && (
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Stripe billing is not configured on this server. Contact your administrator to upgrade.
            </p>
          )}
        </div>
      )}

      {venue.subscription?.smsNotifications && (
        <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 480 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SMS notifications</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button className={smsEnabled ? 'primary' : ''} onClick={toggleSms}>
              {smsEnabled ? 'SMS enabled' : 'Enable SMS'}
            </button>
            {smsStatus && !smsStatus.configured && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Twilio not configured on server</span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Add player phone numbers for automatic fixture reminders. Manual send available on fixtures tab.
          </p>
          {smsEnabled && (
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                <input type="checkbox" checked={autoSms} onChange={(e) => setAutoSms(e.target.checked)} />
                Auto-send reminders {reminderHours}h before fixtures
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={reminderHours}
                  onChange={(e) => setReminderHours(Number(e.target.value))}
                  style={{ width: 72, padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>hours before</span>
                <button onClick={saveSmsSettings}>Save</button>
              </div>
            </div>
          )}
        </div>
      )}

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
