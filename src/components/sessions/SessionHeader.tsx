import { useState } from 'react';
import { Video, MessageSquare } from 'lucide-react';
import type { SessionWithMeta } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface SessionHeaderProps {
  session: SessionWithMeta;
  isCreator: boolean;
  onJoin: () => Promise<void>;
  onLeave: () => Promise<void>;
  onClose: () => Promise<void>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SessionHeader({ session, isCreator, onJoin, onLeave, onClose }: SessionHeaderProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const isClosed = session.status === 'closed';
  const isFull = session.participant_count >= session.max_participants;

  async function handleAction(action: () => Promise<void>) {
    setActionLoading(true);
    try {
      await action();
    } catch {
      // errors handled by hook
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClose() {
    setActionLoading(true);
    try {
      await onClose();
    } catch {
      // errors handled by hook
    } finally {
      setActionLoading(false);
      setCloseDialogOpen(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Title + badge */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-navy-light">{session.title}</h1>
        <Badge
          className={
            session.format === 'video'
              ? 'bg-blue-100 text-blue-700 border-blue-200 shrink-0'
              : 'bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0'
          }
        >
          {session.format === 'video' ? (
            <Video className="h-3 w-3 mr-1" />
          ) : (
            <MessageSquare className="h-3 w-3 mr-1" />
          )}
          {session.format === 'video' ? 'Video' : 'Chat'}
        </Badge>
      </div>

      {/* Description */}
      {session.description && (
        <p className="text-gray-600">{session.description}</p>
      )}

      {/* Meta line */}
      <p className="text-sm text-gray-500">
        Started by {session.creator.name ?? 'Unknown'} &middot;{' '}
        {formatDate(session.created_at)} &middot;{' '}
        {session.participant_count}/{session.max_participants} participants
      </p>

      {/* Actions */}
      {!isClosed && (
        <div className="flex items-center gap-2 pt-1">
          {!session.is_participant && !isFull && (
            <Button
              size="sm"
              disabled={actionLoading}
              className="bg-brand-gold hover:bg-brand-gold-hover text-white"
              onClick={() => handleAction(onJoin)}
            >
              Join
            </Button>
          )}

          {session.is_participant && !isCreator && (
            <Button
              size="sm"
              variant="outline"
              disabled={actionLoading}
              onClick={() => handleAction(onLeave)}
            >
              Leave
            </Button>
          )}

          {isCreator && (
            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Close Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close this session?</DialogTitle>
                  <DialogDescription>
                    This will end the session for all participants. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    disabled={actionLoading}
                    onClick={handleClose}
                  >
                    Close Session
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {isClosed && (
        <Badge variant="secondary" className="text-gray-500">Closed</Badge>
      )}
    </div>
  );
}
