import { fireEvent, render, screen, setupUser, within } from '@/test';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  it('renders selected date with configurable format', () => {
    render(
      <DatePicker
        selectedDate={new Date('2026-02-06T12:00:00.000Z')}
        onDateChange={vi.fn()}
        dateFormat="yyyy-MM-dd"
      />
    );

    expect(screen.getByRole('button', { name: 'Select date' })).toHaveTextContent('2026-02-06');
  });

  it('opens calendar, supports month navigation, and closes with escape', () => {
    render(
      <DatePicker
        selectedDate={new Date('2026-02-06T12:00:00.000Z')}
        onDateChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select date' }));
    const dialog = screen.getByRole('dialog', { name: 'Date picker' });
    expect(within(dialog).getByText('February 2026')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Next month' }));
    expect(within(dialog).getByText('March 2026')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Previous month' }));
    expect(within(dialog).getByText('February 2026')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Date picker' })).not.toBeInTheDocument();
  });

  it('selects a date and reports it to the parent', () => {
    const onDateChange = vi.fn();
    render(
      <DatePicker
        selectedDate={new Date('2026-02-06T12:00:00.000Z')}
        onDateChange={onDateChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select date' }));
    fireEvent.click(screen.getByRole('button', { name: '20' }));

    expect(onDateChange).toHaveBeenCalledTimes(1);
    const selected = onDateChange.mock.calls[0][0] as Date;
    expect(selected.getFullYear()).toBe(2026);
    expect(selected.getMonth()).toBe(1);
    expect(selected.getDate()).toBe(20);
  });

  it('opens with keyboard interaction', async () => {
    const user = setupUser();
    render(
      <DatePicker
        selectedDate={new Date('2026-02-06T12:00:00.000Z')}
        onDateChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Select date' });
    trigger.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('dialog', { name: 'Date picker' })).toBeInTheDocument();
  });
});
