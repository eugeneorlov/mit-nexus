/**
 * Shared timestamp formatter.
 * Today: "2:14 PM"
 * This week (within 7 days): "Mon, 2:14 PM"
 * Older: "Mar 19, 2:14 PM"
 */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const timeStr = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Same calendar day
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return timeStr;
  }

  // Within 7 days (past or future)
  const diffMs = Math.abs(now.getTime() - date.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 7) {
    const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
    return `${dayName}, ${timeStr}`;
  }

  // Older or further out
  const dateStr = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr}, ${timeStr}`;
}
