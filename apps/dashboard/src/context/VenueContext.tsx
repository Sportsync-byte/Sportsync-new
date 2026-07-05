import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Venue } from '@sportsync/shared';
import { api } from '@sportsync/api-client';

interface VenueContextValue {
  venue: Venue | null;
  venues: Venue[];
  loading: boolean;
  setVenueId: (id: string) => void;
  refreshVenues: () => Promise<void>;
}

const VenueContext = createContext<VenueContextValue | null>(null);

const STORAGE_KEY = 'sportsync-venue-id';

export function VenueProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshVenues = async () => {
    const list = await api.venues.list();
    setVenues(list);
    const savedId = localStorage.getItem(STORAGE_KEY);
    const selected = list.find((v) => v.id === savedId) || list[0] || null;
    setVenue(selected);
    if (selected) localStorage.setItem(STORAGE_KEY, selected.id);
  };

  useEffect(() => {
    refreshVenues()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setVenueId = (id: string) => {
    const selected = venues.find((v) => v.id === id) || null;
    setVenue(selected);
    if (selected) localStorage.setItem(STORAGE_KEY, selected.id);
  };

  return (
    <VenueContext.Provider value={{ venue, venues, loading, setVenueId, refreshVenues }}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenue() {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error('useVenue must be used within VenueProvider');
  return ctx;
}
