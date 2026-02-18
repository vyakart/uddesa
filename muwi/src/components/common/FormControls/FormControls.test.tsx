import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test';
import { Input, Select, Toggle } from './FormControls';

describe('FormControls', () => {
  it('renders input with accessible label, hint, and error wiring', () => {
    render(
      <Input
        label="Document title"
        hint="Keep it concise."
        error="Title is required."
        placeholder="Untitled"
      />
    );

    const input = screen.getByLabelText('Document title');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('placeholder', 'Untitled');
    expect(input).toHaveAttribute('aria-describedby');

    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain('-hint');
    expect(describedBy).toContain('-error');
    expect(screen.getByText('Keep it concise.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Title is required.');
  });

  it('supports select interactions with keyboard/screen-reader semantics', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Select label="Citation style" defaultValue="apa" onChange={handleChange}>
        <option value="apa">APA</option>
        <option value="mla">MLA</option>
      </Select>
    );

    const select = screen.getByRole('combobox', { name: 'Citation style' });
    expect(select).toHaveValue('apa');

    await user.selectOptions(select, 'mla');
    expect(select).toHaveValue('mla');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('supports toggle keyboard behavior and switch role semantics', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Toggle label="Enable autosave" checked={false} onChange={handleChange} />);

    const toggle = screen.getByRole('switch', { name: 'Enable autosave' });
    expect(toggle).not.toBeChecked();

    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard(' ');

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('uses tokenized placeholder, disabled, and focus styles', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/shell.css'), 'utf8');

    expect(css).toContain('.muwi-form-control::placeholder');
    expect(css).toContain('color: var(--color-text-tertiary);');
    expect(css).toContain('.muwi-form-control:disabled');
    expect(css).toContain('background: var(--color-bg-tertiary);');
    expect(css).toContain('.muwi-form-control:focus-visible');
    expect(css).toContain('box-shadow: var(--shadow-focus);');
  });
});
