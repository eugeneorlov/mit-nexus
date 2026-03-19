import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import { useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useMapData } from '@/hooks/useMapData';
import { MapPin } from '@/components/map/MapPin';
import { TravelPin } from '@/components/map/TravelPin';
import { AddTripModal } from '@/components/map/AddTripModal';
import { MapFilterOverlay, type MapFilters } from '@/components/map/MapFilterOverlay';
import type { ProfileWithTags } from '@/lib/types';

function computeCenter(profiles: ProfileWithTags[]): [number, number] {
  if (profiles.length === 0) return [20, 0];
  const sumLat = profiles.reduce((acc, p) => acc + p.latitude!, 0);
  const sumLng = profiles.reduce((acc, p) => acc + p.longitude!, 0);
  return [sumLat / profiles.length, sumLng / profiles.length];
}

const DEFAULT_FILTERS: MapFilters = {
  selectedTags: [],
  tagMode: 'any',
  showHome: true,
  showTravelers: true,
};

export default function MapPage() {
  const { homeProfiles, activeTrips, loading, refetch } = useMapData();
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);

  const center = computeCenter(homeProfiles);

  // Collect all unique tags across all profiles
  const allTags = useMemo(() => {
    const set = new Set<string>();
    homeProfiles.forEach((p) => {
      p.helpTags.forEach((t) => set.add(t));
      p.learnTags.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [homeProfiles]);

  // Filter helper: does a profile match the selected tags?
  function profileMatchesTags(profile: ProfileWithTags): boolean {
    if (filters.selectedTags.length === 0) return true;
    const { tagMode, selectedTags } = filters;
    if (tagMode === 'help') {
      return selectedTags.some((t) => profile.helpTags.includes(t));
    }
    if (tagMode === 'learn') {
      return selectedTags.some((t) => profile.learnTags.includes(t));
    }
    // 'any'
    return selectedTags.some(
      (t) => profile.helpTags.includes(t) || profile.learnTags.includes(t)
    );
  }

  const visibleHomeProfiles = useMemo(() => {
    if (!filters.showHome) return [];
    return homeProfiles.filter(profileMatchesTags);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeProfiles, filters]);

  const visibleTrips = useMemo(() => {
    if (!filters.showTravelers) return [];
    return activeTrips.filter((trip) => profileMatchesTags(trip.profile));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrips, filters]);

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] md:h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-[1000]">
          <span className="text-sm text-gray-500">Loading map…</span>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MarkerClusterGroup chunkedLoading>
          {visibleHomeProfiles.map((profile) => (
            <MapPin key={profile.id} profile={profile} />
          ))}
        </MarkerClusterGroup>

        {/* Travel pins are outside cluster so they stay always visible */}
        {visibleTrips.map((trip) => (
          <TravelPin key={trip.id} trip={trip} />
        ))}
      </MapContainer>

      {/* Filter overlay — top-right */}
      <div className="absolute top-4 right-4 z-[1000]">
        <MapFilterOverlay
          allTags={allTags}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      {/* Add a Trip button — bottom-right */}
      <div className="absolute bottom-8 right-4 z-[1000]">
        <AddTripModal onTripAdded={refetch} />
      </div>
    </div>
  );
}
