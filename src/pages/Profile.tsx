import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/AuthContext';

// Fix Leaflet default marker icons in bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, error } = useProfile(id);

  const isOwnProfile = user?.id === id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Loading profile…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error ?? 'Profile not found.'}</p>
      </div>
    );
  }

  const initials = getInitials(profile.name);
  const hasLocation = profile.latitude !== null && profile.longitude !== null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 flex-shrink-0 ring-2 ring-[#F59E0B] ring-offset-2">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.name ?? ''} />
              ) : null}
              <AvatarFallback className="bg-[#1E293B] text-white text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[#1E293B] leading-tight">
                {profile.name ?? 'Unknown'}
              </h1>

              {(profile.role || profile.company) && (
                <p className="text-base text-gray-600 mt-1">
                  {[profile.role, profile.company].filter(Boolean).join(' @ ')}
                </p>
              )}

              {(profile.city || profile.country) && (
                <p className="text-sm text-gray-400 mt-1">
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-5">
            {isOwnProfile ? (
              <Button
                className="bg-[#1E293B] hover:bg-[#0f172a] text-white"
                onClick={() => navigate('/profile/edit')}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
                onClick={() => navigate(`/messages/${profile.id}`)}
              >
                Send Message
              </Button>
            )}

            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-[#1E293B] text-[#1E293B]">
                  LinkedIn
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {profile.bio && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              About
            </h2>
            <p className="text-[#1E293B] leading-relaxed">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {(profile.helpTags.length > 0 || profile.learnTags.length > 0) && (
        <Card>
          <CardContent className="p-6 space-y-5">
            {profile.helpTags.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Can help with
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.helpTags.map((tag) => (
                    <Badge
                      key={tag}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-200 border text-sm"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.helpTags.length > 0 && profile.learnTags.length > 0 && (
              <Separator />
            )}

            {profile.learnTags.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Wants to learn
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.learnTags.map((tag) => (
                    <Badge
                      key={tag}
                      className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 border text-sm"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mini map */}
      {hasLocation && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Location
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              {[profile.city, profile.country].filter(Boolean).join(', ')}
            </p>
            <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: 200 }}>
              <MapContainer
                center={[profile.latitude!, profile.longitude!]}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={[profile.latitude!, profile.longitude!]} />
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back link */}
      <div className="text-center">
        <Link to="/directory" className="text-sm text-gray-400 hover:text-[#1E293B] transition-colors">
          ← Back to directory
        </Link>
      </div>
    </div>
  );
}
