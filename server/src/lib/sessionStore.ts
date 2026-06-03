/**
 * In-memory store of active Excel/Guacamole sessions.
 *
 * A session is keyed by fileId. We enforce a hard cap (MAX_SESSIONS, default 3)
 * of concurrent open files. Because Guacamole gives us no reliable "closed"
 * callback, each session also has a TTL after which it is considered stale and
 * is reclaimed automatically (slightly longer than the token TTL so a user who
 * just opened a file is never evicted mid-launch).
 */

interface ActiveSession {
  fileId: string;
  uid: string;
  fileName: string;
  openedAt: number;
}

const sessions = new Map<string, ActiveSession>();

function maxSessions(): number {
  const n = Number(process.env.MAX_SESSIONS || 3);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

// A session is reclaimed if it has been open longer than this without an
// explicit close. Generous default (15 min) so real usage is not interrupted.
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 15 * 60 * 1000);

function reapStale(): void {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.openedAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

export function activeCount(): number {
  reapStale();
  return sessions.size;
}

export function listSessions(): ActiveSession[] {
  reapStale();
  return Array.from(sessions.values());
}

export function hasCapacity(fileId: string): boolean {
  reapStale();
  // Re-opening an already-open file does not consume a new slot.
  if (sessions.has(fileId)) return true;
  return sessions.size < maxSessions();
}

/**
 * Registers (or refreshes) a session for the given file.
 * Returns false if there is no capacity for a new session.
 */
export function openSession(fileId: string, uid: string, fileName: string): boolean {
  reapStale();
  if (!sessions.has(fileId) && sessions.size >= maxSessions()) {
    return false;
  }
  sessions.set(fileId, { fileId, uid, fileName, openedAt: Date.now() });
  return true;
}

export function closeSession(fileId: string): boolean {
  return sessions.delete(fileId);
}

export function getMaxSessions(): number {
  return maxSessions();
}
