import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';

export interface PasskeyPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (passkey: string) => void | Promise<void>;
  title?: string;
  description?: string;
  hint?: string;
  error?: string | null;
  submitLabel?: string;
  cancelLabel?: string;
}

export function PasskeyPrompt({
  isOpen,
  onClose,
  onSubmit,
  title = 'Enter passkey',
  description = 'Enter your passkey to continue.',
  hint,
  error,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
}: PasskeyPromptProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [passkey, setPasskey] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPasskeyVisible, setIsPasskeyVisible] = useState(false);
  const [isHintVisible, setIsHintVisible] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = passkey.trim();

    if (!value) {
      setLocalError('Passkey is required');
      return;
    }

    setLocalError(null);

    try {
      await onSubmit(value);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to verify passkey');
    }
  };

  const activeError = error || localError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      initialFocusRef={inputRef}
      className="muwi-passkey-modal"
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="muwi-passkey-form">
        <p className="muwi-passkey-description">{description}</p>

        <label htmlFor="passkey-input" className="muwi-field">
          <span className="muwi-field__label">Passkey</span>
          <div className="muwi-passkey-row">
            <input
              ref={inputRef}
              id="passkey-input"
              aria-label="Passkey"
              type={isPasskeyVisible ? 'text' : 'password'}
              value={passkey}
              onChange={(event) => {
                setPasskey(event.target.value);
                if (localError) {
                  setLocalError(null);
                }
              }}
              className="muwi-form-control muwi-passkey-input"
            />
            <Button
              type="button"
              aria-label={isPasskeyVisible ? 'Hide passkey' : 'Show passkey'}
              onClick={() => setIsPasskeyVisible((visible) => !visible)}
              variant="secondary"
              size="md"
            >
              {isPasskeyVisible ? 'Hide' : 'Show'}
            </Button>
          </div>
        </label>

        <div className="muwi-passkey-hint-area">
          <Button type="button" onClick={() => setIsHintVisible((visible) => !visible)} variant="ghost" size="md">
            {isHintVisible ? 'Hide hint' : 'Show hint'}
          </Button>
          {isHintVisible ? (
            <p role="status" className="muwi-passkey-hint">
              {hint?.trim() ? hint : 'No hint is set for this passkey.'}
            </p>
          ) : null}
        </div>

        {activeError ? (
          <p role="alert" className="muwi-passkey-error">
            {activeError}
          </p>
        ) : null}

        <div className="muwi-passkey-actions">
          <Button type="button" onClick={onClose} variant="secondary" size="md">
            {cancelLabel}
          </Button>
          <Button type="submit" variant="primary" size="md">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
