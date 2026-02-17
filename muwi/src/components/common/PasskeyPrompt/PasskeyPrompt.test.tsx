import { render, screen, setupUser } from '@/test';
import { PasskeyPrompt } from './PasskeyPrompt';

describe('PasskeyPrompt', () => {
  it('renders passkey input and submit button', () => {
    render(<PasskeyPrompt isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Passkey')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('toggles passkey visibility', async () => {
    const user = setupUser();
    render(<PasskeyPrompt isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);

    const passkeyInput = screen.getByLabelText('Passkey');
    expect(passkeyInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show passkey' }));
    expect(passkeyInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide passkey' }));
    expect(passkeyInput).toHaveAttribute('type', 'password');
  });

  it('shows and hides hint text', async () => {
    const user = setupUser();
    render(<PasskeyPrompt isOpen onClose={vi.fn()} onSubmit={vi.fn()} hint="pet name + year" />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show hint' }));
    expect(screen.getByRole('status')).toHaveTextContent('pet name + year');

    await user.click(screen.getByRole('button', { name: 'Hide hint' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('submits passkey value', async () => {
    const user = setupUser();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PasskeyPrompt isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Passkey'), 'my-passkey');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith('my-passkey');
  });

  it('shows validation error when submitting empty passkey', async () => {
    const user = setupUser();
    render(<PasskeyPrompt isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Passkey is required');
  });

  it('shows external error message', () => {
    render(<PasskeyPrompt isOpen onClose={vi.fn()} onSubmit={vi.fn()} error="Invalid passkey" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid passkey');
  });
});
