import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Check } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ParticipantRowProps {
  participants: Profile[];
  sessionId: string;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ParticipantRow({ participants, sessionId }: ParticipantRowProps) {
  const [copied, setCopied] = useState(false);

  async function copyInviteLink() {
    const url = `${window.location.origin}/sessions/${sessionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may fail in non-secure contexts
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Overlapping avatars */}
      <div className="flex -space-x-2">
        {participants.map((p) => (
          <Link key={p.id} to={`/profile/${p.id}`} title={p.name ?? 'Unknown'}>
            <Avatar className="h-8 w-8 border-2 border-white hover:z-10 transition-transform hover:scale-110">
              {p.avatar_url && (
                <AvatarImage src={p.avatar_url} alt={p.name ?? ''} />
              )}
              <AvatarFallback className="text-[10px] bg-brand-navy text-white">
                {getInitials(p.name)}
              </AvatarFallback>
            </Avatar>
          </Link>
        ))}
      </div>

      {/* Invite button */}
      <Button
        size="sm"
        variant="ghost"
        className="text-brand-gold hover:text-brand-gold-hover text-sm gap-1"
        onClick={copyInviteLink}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            + Invite
          </>
        )}
      </Button>
    </div>
  );
}
