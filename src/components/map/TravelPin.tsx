import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { TripWithProfile } from '@/hooks/useMapData';

const travelIcon = L.divIcon({
  className: '',
  html: `<div class="travel-pin-pulse" style="
    width: 18px;
    height: 18px;
    background-color: #F59E0B;
    border: 2.5px solid white;
    border-radius: 50%;
    box-shadow: 0 1px 6px rgba(245,158,11,0.6);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

interface TravelPinProps {
  trip: TripWithProfile;
}

export function TravelPin({ trip }: TravelPinProps) {
  const navigate = useNavigate();
  const { profile } = trip;

  if (!trip.latitude || !trip.longitude) return null;

  return (
    <Marker position={[trip.latitude, trip.longitude]} icon={travelIcon}>
      <Popup minWidth={220} maxWidth={260} className="map-profile-popup">
        <div style={{ fontFamily: 'inherit', padding: '4px' }}>
          <div style={{ marginBottom: '6px' }}>
            <p className="font-semibold text-[#1E293B] text-sm leading-tight">
              {profile.name ?? 'Unknown'}
            </p>
            {profile.company && (
              <p className="text-xs text-gray-500">{profile.company}</p>
            )}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <p className="text-xs text-amber-600 font-medium">
              {[trip.city, trip.country].filter(Boolean).join(', ')}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {trip.date_from} → {trip.date_to}
            </p>
          </div>

          {trip.note && (
            <p className="text-xs text-gray-600 italic mb-8px border-l-2 border-amber-300 pl-2 mb-2">
              {trip.note}
            </p>
          )}

          <Button
            size="sm"
            className="w-full text-xs h-7 bg-[#F59E0B] hover:bg-[#D97706] text-white"
            onClick={() => navigate(`/messages/${profile.id}`)}
          >
            Send Message
          </Button>
        </div>
      </Popup>
    </Marker>
  );
}
