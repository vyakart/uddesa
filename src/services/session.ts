/**
 * Session management for locked diaries
 * 
 * Handles session timeouts, activity tracking, and auto-lock after inactivity
 */

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

interface SessionData {
  diaryId: string;
  passwordHash: string;
  expiresAt: number;
}

class SessionManager {
  private sessions = new Map<string, SessionData>();
  private activityTimer: number | null = null;
  private isListening = false;

  /**
   * Start a new session for a diary
   */
  startSession(diaryId: string, passwordHash: string, remember: boolean = false): void {
    if (!remember) {
      // Don't persist session
      return;
    }

    const expiresAt = Date.now() + SESSION_TIMEOUT_MS;
    this.sessions.set(diaryId, {
      diaryId,
      passwordHash,
      expiresAt,
    });

    this.startActivityTracking();

    console.info(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        module: 'session',
        message: 'Session started',
        diaryId,
        expiresAt: new Date(expiresAt).toISOString(),
      }),
    );
  }

  /**
   * End a session for a diary
   */
  endSession(diaryId: string): void {
    this.sessions.delete(diaryId);

    if (this.sessions.size === 0) {
      this.stopActivityTracking();
    }

    console.info(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        module: 'session',
        message: 'Session ended',
        diaryId,
      }),
    );
  }

  /**
   * Check if a session is active and valid
   */
  hasValidSession(diaryId: string): boolean {
    const session = this.sessions.get(diaryId);
    if (!session) {
      return false;
    }

    const now = Date.now();
    if (now >= session.expiresAt) {
      // Session expired
      this.endSession(diaryId);
      return false;
    }

    return true;
  }

  /**
   * Get session password hash for verification
   */
  getSessionPasswordHash(diaryId: string): string | null {
    const session = this.sessions.get(diaryId);
    if (!session || !this.hasValidSession(diaryId)) {
      return null;
    }
    return session.passwordHash;
  }

  /**
   * Refresh session expiration time
   */
  private refreshSession(diaryId: string): void {
    const session = this.sessions.get(diaryId);
    if (!session) {
      return;
    }

    session.expiresAt = Date.now() + SESSION_TIMEOUT_MS;
  }

  /**
   * Refresh all active sessions
   */
  private refreshAllSessions(): void {
    for (const diaryId of this.sessions.keys()) {
      this.refreshSession(diaryId);
    }
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    if (this.activityTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.activityTimer);
    }

    // Refresh all sessions
    this.refreshAllSessions();

    // Set new timer to check for timeout
    if (typeof window !== 'undefined') {
      this.activityTimer = window.setTimeout(() => {
        this.checkExpiredSessions();
      }, SESSION_TIMEOUT_MS);
    }
  };

  /**
   * Check for expired sessions
   */
  private checkExpiredSessions(): void {
    const now = Date.now();
    const expiredDiaryIds: string[] = [];

    for (const [diaryId, session] of this.sessions) {
      if (now >= session.expiresAt) {
        expiredDiaryIds.push(diaryId);
      }
    }

    for (const diaryId of expiredDiaryIds) {
      console.info(
        JSON.stringify({
          level: 'INFO',
          timestamp: new Date().toISOString(),
          module: 'session',
          message: 'Session expired due to inactivity',
          diaryId,
        }),
      );
      this.endSession(diaryId);
    }
  }

  /**
   * Start tracking user activity
   */
  private startActivityTracking(): void {
    if (this.isListening || typeof document === 'undefined') {
      return;
    }

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, this.handleActivity, { passive: true });
    }

    this.isListening = true;
    this.handleActivity(); // Initialize timer
  }

  /**
   * Stop tracking user activity
   */
  private stopActivityTracking(): void {
    if (!this.isListening || typeof document === 'undefined') {
      return;
    }

    for (const event of ACTIVITY_EVENTS) {
      document.removeEventListener(event, this.handleActivity);
    }

    if (this.activityTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }

    this.isListening = false;
  }

  /**
   * Clear all sessions
   */
  clearAll(): void {
    this.sessions.clear();
    this.stopActivityTracking();
  }
}

// Global session manager instance
export const sessionManager = new SessionManager();