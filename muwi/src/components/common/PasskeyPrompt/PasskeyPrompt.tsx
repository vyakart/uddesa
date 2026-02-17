import { FormEvent, useRef, useState } from 'react';
import { Modal } from '../Modal';

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
    <Modal isOpen={isOpen} onClose={onClose} title={title} initialFocusRef={inputRef}>
      <form onSubmit={(event) => void handleSubmit(event)} style={{ display: 'grid', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 14, color: '#4f4f4f' }}>{description}</p>

        <label htmlFor="passkey-input" style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Passkey</span>
          <div style={{ display: 'flex', gap: 8 }}>
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
              style={{
                flex: 1,
                border: '1px solid #d8d8d8',
                borderRadius: 8,
                padding: '0.55rem 0.7rem',
                fontSize: 14,
              }}
            />
            <button
              type="button"
              aria-label={isPasskeyVisible ? 'Hide passkey' : 'Show passkey'}
              onClick={() => setIsPasskeyVisible((visible) => !visible)}
            >
              {isPasskeyVisible ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <div style={{ display: 'grid', gap: 8 }}>
          <button type="button" onClick={() => setIsHintVisible((visible) => !visible)}>
            {isHintVisible ? 'Hide hint' : 'Show hint'}
          </button>
          {isHintVisible ? (
            <p
              role="status"
              style={{
                margin: 0,
                padding: '0.55rem 0.7rem',
                borderRadius: 8,
                backgroundColor: '#f7f7f7',
                fontSize: 13,
                color: '#525252',
              }}
            >
              {hint?.trim() ? hint : 'No hint is set for this passkey.'}
            </p>
          ) : null}
        </div>

        {activeError ? (
          <p role="alert" style={{ margin: 0, fontSize: 13, color: '#b42318' }}>
            {activeError}
          </p>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="submit">{submitLabel}</button>
        </div>
      </form>
    </Modal>
  );
}
