import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare, Minus, Plus, Video } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { toast } from '@/lib/toast';
import type { CreateSessionInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MeetingLinkInput } from './MeetingLinkInput';

interface FormErrors {
  title?: string;
  meeting_link?: string;
}

export function CreateSessionForm() {
  const navigate = useNavigate();
  const { createSession } = useSessions();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<'chat' | 'video'>('chat');
  const [meetingLink, setMeetingLink] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};

    if (!title.trim()) {
      next.title = 'Title is required';
    }

    if (format === 'video' && meetingLink && !meetingLink.startsWith('https://')) {
      next.meeting_link = 'Meeting link must start with https://';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleMeetingLinkChange(value: string) {
    setMeetingLink(value);
    if (value && !value.startsWith('https://')) {
      setErrors((prev) => ({ ...prev, meeting_link: 'Meeting link must start with https://' }));
    } else {
      setErrors((prev) => {
        const { meeting_link: _, ...rest } = prev;
        return rest;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const input: CreateSessionInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        format,
        max_participants: maxParticipants,
      };

      if (format === 'video') {
        if (meetingLink) input.meeting_link = meetingLink;
        if (scheduledAt) input.scheduled_at = new Date(scheduledAt).toISOString();
      }

      const session = await createSession(input);
      navigate(`/sessions/${session.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      toast(message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-brand-navy-light font-medium">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="AI Governance in Regulated Industries"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={errors.title ? 'border-red-400' : ''}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-brand-navy-light font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="What would you like to discuss?"
          maxLength={500}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-xs text-gray-400 text-right">{description.length}/500</p>
      </div>

      {/* Format toggle */}
      <div className="space-y-1.5">
        <Label className="text-brand-navy-light font-medium">Format</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={format === 'chat' ? 'default' : 'outline'}
            className={format === 'chat' ? 'bg-brand-navy-light hover:bg-brand-navy-light/90' : ''}
            onClick={() => setFormat('chat')}
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Chat
          </Button>
          <Button
            type="button"
            variant={format === 'video' ? 'default' : 'outline'}
            className={format === 'video' ? 'bg-brand-navy-light hover:bg-brand-navy-light/90' : ''}
            onClick={() => setFormat('video')}
          >
            <Video className="h-4 w-4 mr-1.5" />
            Video
          </Button>
        </div>
      </div>

      {/* Video-only fields */}
      {format === 'video' && (
        <>
          <MeetingLinkInput
            value={meetingLink}
            onChange={handleMeetingLinkChange}
            error={errors.meeting_link}
          />

          <div className="space-y-1.5">
            <Label htmlFor="scheduled_at" className="text-brand-navy-light font-medium">
              Scheduled Time
            </Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </>
      )}

      {/* Max participants */}
      <div className="space-y-1.5">
        <Label className="text-brand-navy-light font-medium">
          Max Participants
        </Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={maxParticipants <= 3}
            onClick={() => setMaxParticipants((v) => Math.max(3, v - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-medium text-brand-navy-light">
            {maxParticipants}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={maxParticipants >= 10}
            onClick={() => setMaxParticipants((v) => Math.min(10, v + 1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-brand-gold hover:bg-brand-gold-hover text-white"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating…
          </>
        ) : (
          'Create Session'
        )}
      </Button>
    </form>
  );
}
