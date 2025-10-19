import { useState, useCallback, useEffect } from 'react';
import { validatePasswordStrength } from '../services/crypto';

export interface LockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLock?: (password: string) => void | Promise<void>;
  onUnlock?: (password: string, rememberSession: boolean) => void | Promise<void>;
  isLocked: boolean;
  diaryTitle: string;
}

/**
 * Dialog for locking/unlocking a diary with password
 */
export function LockDialog({
  isOpen,
  onClose,
  onLock,
  onUnlock,
  isLocked,
  diaryTitle,
}: LockDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const passwordStrength = validatePasswordStrength(password);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError('');
      setShowPassword(false);
      setRememberSession(false);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!password) {
        setError('Password is required');
        return;
      }

      if (!isLocked) {
        // Locking the diary
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        if (!passwordStrength.isStrong) {
          setError('Password is not strong enough. ' + passwordStrength.feedback.join('. '));
          return;
        }

        setIsProcessing(true);
        try {
          await onLock?.(password);
          onClose();
        } catch (error: unknown) {
          setError(error instanceof Error ? error.message : 'Failed to lock diary');
        } finally {
          setIsProcessing(false);
        }
      } else {
        // Unlocking the diary
        setIsProcessing(true);
        try {
          await onUnlock?.(password, rememberSession);
          onClose();
        } catch {
          setError('Incorrect password');
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [
      password,
      confirmPassword,
      isLocked,
      passwordStrength,
      onLock,
      onUnlock,
      onClose,
      rememberSession,
    ],
  );

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isProcessing]);

  if (!isOpen) {
    return null;
  }

  const getStrengthColor = (score: number): string => {
    if (score === 0) return '#dc2626';
    if (score === 1) return '#f59e0b';
    if (score === 2) return '#eab308';
    if (score === 3) return '#84cc16';
    return '#22c55e';
  };

  const getStrengthLabel = (score: number): string => {
    if (score === 0) return 'Very Weak';
    if (score === 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Strong';
    return 'Very Strong';
  };

  return (
    <div
      id="lock-dialog"
      className="modal-overlay"
      onClick={() => {
        if (!isProcessing) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-dialog-title"
    >
      <div className="modal-content lock-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 id="lock-dialog-title">
            {isLocked ? 'Unlock Diary' : 'Lock Diary'}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close lock dialog"
            disabled={isProcessing}
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="lock-dialog__description">
              {isLocked
                ? `Enter the password to unlock "${diaryTitle}"`
                : `Set a password to encrypt and lock "${diaryTitle}"`}
            </p>

            <div className="lock-dialog__field">
              <label htmlFor="password" className="lock-dialog__label">
                Password
              </label>
              <div className="lock-dialog__input-group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="lock-dialog__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                  disabled={isProcessing}
                  required
                />
                <button
                  type="button"
                  className="lock-dialog__toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isProcessing}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {!isLocked && password && (
              <div className="lock-dialog__strength">
                <div className="lock-dialog__strength-bar">
                  <div
                    className="lock-dialog__strength-fill"
                    style={{
                      width: `${(passwordStrength.score / 4) * 100}%`,
                      backgroundColor: getStrengthColor(passwordStrength.score),
                    }}
                  />
                </div>
                <span
                  className="lock-dialog__strength-label"
                  style={{ color: getStrengthColor(passwordStrength.score) }}
                >
                  {getStrengthLabel(passwordStrength.score)}
                </span>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="lock-dialog__feedback">
                    {passwordStrength.feedback.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!isLocked && (
              <div className="lock-dialog__field">
                <label htmlFor="confirm-password" className="lock-dialog__label">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="lock-dialog__input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  disabled={isProcessing}
                  required
                />
              </div>
            )}

            {isLocked && (
              <div className="lock-dialog__checkbox">
                <input
                  id="remember-session"
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  disabled={isProcessing}
                />
                <label htmlFor="remember-session">
                  Remember for this session (auto-locks after 15 minutes)
                </label>
              </div>
            )}

            {error && (
              <div className="lock-dialog__error" role="alert">
                {error}
              </div>
            )}
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="modal-button modal-button--secondary"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-button modal-button--primary"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : isLocked ? 'Unlock' : 'Lock'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
