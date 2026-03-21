import { useState } from 'react';
import { Video, ExternalLink, Pencil } from 'lucide-react';
import type { SessionWithMeta } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MeetingLinkInput } from '@/components/sessions/MeetingLinkInput';

interface SessionVideoBarProps {
  session: SessionWithMeta;
  isCreator: boolean;
  onUpdateLink: (link: string) => Promise<void>;
}

export function SessionVideoBar({ session, isCreator, onUpdateLink }: SessionVideoBarProps) {
  const [editing, setEditing] = useState(false);
  const [linkValue, setLinkValue] = useState(session.meeting_link ?? '');
  const [linkError, setLinkError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = linkValue.trim();
    if (!trimmed) {
      setLinkError('Please enter a meeting link');
      return;
    }
    if (!trimmed.startsWith('https://')) {
      setLinkError('Link must start with https://');
      return;
    }

    setSaving(true);
    setLinkError('');
    try {
      await onUpdateLink(trimmed);
      setEditing(false);
    } catch {
      setLinkError('Failed to save link');
    } finally {
      setSaving(false);
    }
  }

  // State: editing link (creator only)
  if (editing || (!session.meeting_link && isCreator)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <MeetingLinkInput value={linkValue} onChange={setLinkValue} error={linkError} />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-brand-gold hover:bg-brand-gold-hover text-white"
            disabled={saving}
            onClick={handleSave}
          >
            Save Link
          </Button>
          {session.meeting_link && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setLinkValue(session.meeting_link ?? '');
                setLinkError('');
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // State: has link
  if (session.meeting_link) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
        <a
          href={session.meeting_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <Video className="h-4 w-4" />
          Join Video Call
          <ExternalLink className="h-3 w-3" />
        </a>
        {isCreator && (
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-500 gap-1"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit link
          </Button>
        )}
      </div>
    );
  }

  // State: no link, not creator
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-gray-500 flex items-center gap-2">
      <Video className="h-4 w-4" />
      Waiting for host to share link.
    </div>
  );
}
