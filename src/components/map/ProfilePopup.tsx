import { useNavigate } from 'react-router-dom';
import { Popup } from 'react-leaflet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProfileWithTags } from '@/lib/types';

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface ProfilePopupProps {
  profile: ProfileWithTags;
}

export function ProfilePopup({ profile }: ProfilePopupProps) {
  const navigate = useNavigate();
  const initials = getInitials(profile.name);

  return (
    <Popup minWidth={220} maxWidth={260} className="map-profile-popup">
      <div style={{ fontFamily: 'inherit', padding: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Avatar className="h-10 w-10 flex-shrink-0">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.name ?? ''} />
            ) : null}
            <AvatarFallback className="bg-brand-navy-light text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div style={{ minWidth: 0 }}>
            <p className="font-semibold text-brand-navy-light text-sm leading-tight truncate">
              {profile.name ?? 'Unknown'}
            </p>
            {profile.role && (
              <p className="text-xs text-gray-500 truncate">{profile.role}</p>
            )}
            {profile.company && (
              <p className="text-xs text-gray-400 truncate">{profile.company}</p>
            )}
          </div>
        </div>

        {(profile.helpTags.length > 0 || profile.learnTags.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
            {profile.helpTags.slice(0, 1).map((tag) => (
              <Badge
                key={tag}
                className="text-xs px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 border"
              >
                {tag}
              </Badge>
            ))}
            {profile.learnTags.slice(0, 1).map((tag) => (
              <Badge
                key={tag}
                className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 border"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-7 text-brand-navy-light border-[#1E293B] hover:bg-brand-navy-light hover:text-white"
            onClick={() => navigate(`/profile/${profile.id}`)}
          >
            View Profile
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs h-7 bg-brand-gold hover:bg-brand-gold-hover text-white"
            onClick={() => navigate(`/messages/${profile.id}`)}
          >
            Send Message
          </Button>
        </div>
      </div>
    </Popup>
  );
}
