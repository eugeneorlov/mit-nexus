import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useMapData } from '@/hooks/useMapData';
import { MapPin } from '@/components/map/MapPin';
import type { ProfileWithTags } from '@/lib/types';

function computeCenter(profiles: ProfileWithTags[]): [number, number] {
  if (profiles.length === 0) return [20, 0];
  const sumLat = profiles.reduce((acc, p) => acc + p.latitude!, 0);
  const sumLng = profiles.reduce((acc, p) => acc + p.longitude!, 0);
  return [sumLat / profiles.length, sumLng / profiles.length];
}

export default function MapPage() {
  const { homeProfiles, loading } = useMapData();
  const center = computeCenter(homeProfiles);

  return (
    <div
      className="relative w-full h-[calc(100vh-3.5rem)] md:h-screen"
    >
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
          {homeProfiles.map((profile) => (
            <MapPin key={profile.id} profile={profile} />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
