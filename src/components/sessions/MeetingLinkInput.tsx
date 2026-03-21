import { ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MeetingLinkInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function MeetingLinkInput({ value, onChange, error }: MeetingLinkInputProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="meeting_link" className="text-brand-navy-light font-medium">
        Meeting Link
      </Label>
      <Input
        id="meeting_link"
        type="url"
        placeholder="https://meet.google.com/abc-defg-hij"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'border-red-400' : ''}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-gray-500">
        Create a meeting in your preferred tool, then paste the link here.
      </p>
      <div className="flex gap-3 text-xs">
        <a
          href="https://meet.google.com/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-brand-navy-light hover:underline"
        >
          Create Google Meet <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href="https://zoom.us/start/videomeeting"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-brand-navy-light hover:underline"
        >
          Create Zoom Meeting <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
