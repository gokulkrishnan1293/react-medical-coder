/** "3 min ago", "2 h ago". */
export function ago(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

/** Time of day for today, otherwise the date. */
export function clock(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
