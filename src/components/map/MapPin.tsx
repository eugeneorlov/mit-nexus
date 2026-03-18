import L from 'leaflet';
import { Marker } from 'react-leaflet';
import { ProfilePopup } from './ProfilePopup';
import type { ProfileWithTags } from '@/lib/types';

const homeIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 16px;
    height: 16px;
    background-color: #1E293B;
    border: 2.5px solid white;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

interface MapPinProps {
  profile: ProfileWithTags;
}

export function MapPin({ profile }: MapPinProps) {
  return (
    <Marker
      position={[profile.latitude!, profile.longitude!]}
      icon={homeIcon}
    >
      <ProfilePopup profile={profile} />
    </Marker>
  );
}
