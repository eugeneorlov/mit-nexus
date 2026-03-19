import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProfileWithTags } from '@/lib/types';

interface ProfileCardProps {
  profile: ProfileWithTags;
  compact?: boolean;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function countryFlag(country: string | null): string {
  if (!country) return '';
  // Convert country name to flag emoji using regional indicator symbols
  // For common countries map name → ISO code, fallback to empty
  const countryCodeMap: Record<string, string> = {
    'United States': 'US', 'USA': 'US', 'United Kingdom': 'GB', 'UK': 'GB',
    'Germany': 'DE', 'France': 'FR', 'Canada': 'CA', 'Australia': 'AU',
    'Japan': 'JP', 'China': 'CN', 'India': 'IN', 'Brazil': 'BR',
    'Netherlands': 'NL', 'Sweden': 'SE', 'Switzerland': 'CH', 'Spain': 'ES',
    'Italy': 'IT', 'Singapore': 'SG', 'Israel': 'IL', 'South Korea': 'KR',
    'Portugal': 'PT', 'Denmark': 'DK', 'Norway': 'NO', 'Finland': 'FI',
    'Austria': 'AT', 'Belgium': 'BE', 'Poland': 'PL', 'Mexico': 'MX',
    'Argentina': 'AR', 'Chile': 'CL', 'Colombia': 'CO', 'New Zealand': 'NZ',
    'Ireland': 'IE', 'Russia': 'RU', 'Ukraine': 'UA', 'Estonia': 'EE',
    'Latvia': 'LV', 'Lithuania': 'LT', 'Czech Republic': 'CZ', 'Slovakia': 'SK',
    'Hungary': 'HU', 'Romania': 'RO', 'Bulgaria': 'BG', 'Croatia': 'HR',
    'Serbia': 'RS', 'Greece': 'GR', 'Turkey': 'TR', 'UAE': 'AE',
    'United Arab Emirates': 'AE', 'Saudi Arabia': 'SA', 'Indonesia': 'ID',
    'Malaysia': 'MY', 'Thailand': 'TH', 'Vietnam': 'VN', 'Philippines': 'PH',
    'Taiwan': 'TW', 'Hong Kong': 'HK', 'South Africa': 'ZA',
    'Nigeria': 'NG', 'Kenya': 'KE', 'Egypt': 'EG', 'Pakistan': 'PK',
    'Bangladesh': 'BD', 'Sri Lanka': 'LK', 'Ghana': 'GH',
  };

  const code = countryCodeMap[country];
  if (!code) return '';
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

export function ProfileCard({ profile, compact = false }: ProfileCardProps) {
  const navigate = useNavigate();
  const initials = getInitials(profile.name);
  const flag = countryFlag(profile.country);

  if (compact) {
    const topTags = [...profile.helpTags.slice(0, 1), ...profile.learnTags.slice(0, 1)];

    return (
      <Card className="w-full hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.name ?? ''} />
              ) : null}
              <AvatarFallback className="bg-brand-navy-light text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-navy-light text-sm truncate">
                {profile.name ?? 'Unknown'}
              </p>
              {profile.company && (
                <p className="text-xs text-gray-500 truncate">{profile.company}</p>
              )}

              {topTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {profile.helpTags.slice(0, 1).map((tag) => (
                    <Badge
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 border"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {profile.learnTags.slice(0, 1).map((tag) => (
                    <Badge
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 border"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button
            size="sm"
            className="w-full mt-3 bg-brand-gold hover:bg-brand-gold-hover text-white text-xs h-8"
            onClick={() => navigate(`/messages/${profile.id}`)}
          >
            Message
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Full card (directory)
  const displayHelpTags = profile.helpTags.slice(0, 3);
  const displayLearnTags = profile.learnTags.slice(0, 3);

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-brand-gold ring-offset-2">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.name ?? ''} />
            ) : null}
            <AvatarFallback className="bg-brand-navy-light text-white text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-navy-light text-base leading-tight">
              {profile.name ?? 'Unknown'}
            </p>

            {(profile.role || profile.company) && (
              <p className="text-sm text-gray-600 mt-0.5 truncate">
                {[profile.role, profile.company].filter(Boolean).join(' @ ')}
              </p>
            )}

            {(profile.city || profile.country) && (
              <p className="text-xs text-gray-400 mt-1">
                {flag && <span className="mr-1">{flag}</span>}
                {[profile.city, profile.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {(displayHelpTags.length > 0 || displayLearnTags.length > 0) && (
          <div className="mt-4 space-y-2">
            {displayHelpTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {displayHelpTags.map((tag) => (
                  <Badge
                    key={tag}
                    className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 border"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {displayLearnTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {displayLearnTags.map((tag) => (
                  <Badge
                    key={tag}
                    className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 border"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <Link to={`/profile/${profile.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 text-brand-navy-light border-[#1E293B] hover:bg-brand-navy-light hover:text-white text-xs h-8 transition-colors"
          >
            View Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
