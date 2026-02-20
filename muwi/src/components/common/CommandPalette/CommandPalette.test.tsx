import { act, fireEvent, render, screen, waitFor } from '@/test';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  });

  it('does not render when closed', () => {
    render(<CommandPalette />);
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
  });

  it('opens with focused combobox input', () => {
    render(<CommandPalette />);

    act(() => {
      useAppStore.getState().openCommandPalette();
    });

    const input = screen.getByRole('combobox', { name: 'Command search' });
    expect(input).toBeInTheDocument();
    expect(document.activeElement).toBe(input);
  });

  it('filters commands with fuzzy search', () => {
    render(<CommandPalette />);

    act(() => {
      useAppStore.getState().openCommandPalette();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Command search' }), {
      target: { value: 'sett' },
    });

    expect(screen.getByRole('option', { name: /open settings/i })).toBeInTheDocument();
  });

  it('supports keyboard navigation and executes selected command', async () => {
    render(<CommandPalette />);

    act(() => {
      useAppStore.getState().openCommandPalette();
    });

    const input = screen.getByRole('combobox', { name: 'Command search' });
    fireEvent.change(input, { target: { value: 'settings' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(useAppStore.getState().isSettingsOpen).toBe(true);
      expect(useAppStore.getState().isCommandPaletteOpen).toBe(false);
    });
  });

  it('traps tab focus within the command palette surface', () => {
    render(<CommandPalette />);

    act(() => {
      useAppStore.getState().openCommandPalette();
    });

    const input = screen.getByRole('combobox', { name: 'Command search' });
    const options = screen.getAllByRole('option');
    const lastOption = options[options.length - 1];

    lastOption.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(input).toHaveFocus();

    input.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(lastOption).toHaveFocus();
  });

  it('restores focus to the trigger after the palette closes', () => {
    function Harness() {
      return (
        <div>
          <button type="button" onClick={() => useAppStore.getState().openCommandPalette()}>
            Open palette
          </button>
          <CommandPalette />
        </div>
      );
    }

    render(<Harness />);

    const trigger = screen.getByRole('button', { name: 'Open palette' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Command search' }), { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('shows recent commands when query is empty', () => {
    render(<CommandPalette />);

    act(() => {
      const state = useAppStore.getState();
      state.executeCommand('settings:open');
      state.openCommandPalette();
    });

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('Open Settings');
  });

  it('prioritizes context-aware commands in diary view', () => {
    render(<CommandPalette />);

    act(() => {
      useAppStore.setState({ currentView: 'diary', activeDiary: 'drafts' });
      useAppStore.getState().openCommandPalette();
    });

    const input = screen.getByRole('combobox', { name: 'Command search' });
    fireEvent.change(input, { target: { value: 'new' } });

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('New Draft');
  });
});
