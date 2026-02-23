import { useState } from 'react';
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

  it('shows empty-state results and clears active descendant when query has no matches', async () => {
    render(<CommandPalette />);

    act(() => {
      useAppStore.getState().openCommandPalette();
    });

    const input = screen.getByRole('combobox', { name: 'Command search' });
    fireEvent.change(input, { target: { value: '@@@@' } });

    await waitFor(() => {
      expect(screen.getByText('No commands found.')).toBeInTheDocument();
      expect(useAppStore.getState().commandPaletteHighlightedIndex).toBe(-1);
    });
    expect(input).not.toHaveAttribute('aria-activedescendant');
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

  it('handles ArrowUp/ArrowDown wrap-around and Enter with no selected command', async () => {
    render(<CommandPalette />);

    act(() => {
      useAppStore.getState().openCommandPalette();
    });

    const input = screen.getByRole('combobox', { name: 'Command search' });
    const options = screen.getAllByRole('option');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(useAppStore.getState().commandPaletteHighlightedIndex).toBe(1);

    act(() => {
      useAppStore.getState().setCommandPaletteHighlightedIndex(options.length - 1);
    });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(useAppStore.getState().commandPaletteHighlightedIndex).toBe(0);

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(useAppStore.getState().commandPaletteHighlightedIndex).toBe(options.length - 1);

    act(() => {
      useAppStore.getState().setCommandPaletteHighlightedIndex(-1);
    });
    fireEvent.change(input, { target: { value: '@@@@' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useAppStore.getState().isCommandPaletteOpen).toBe(true);
  });

  it('runs diary-only commands (export) and toggles dark-mode command from dark to light', async () => {
    render(<CommandPalette />);
    useSettingsStore.setState((state) => ({
      global: {
        ...state.global,
        theme: 'dark',
      },
    }));

    act(() => {
      useAppStore.setState({
        currentView: 'diary',
        activeDiary: 'drafts',
      });
      useAppStore.getState().openCommandPalette();
    });

    const input = screen.getByRole('combobox', { name: 'Command search' });
    fireEvent.change(input, { target: { value: 'export current' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(useAppStore.getState().rightPanel).toMatchObject({
        isOpen: true,
        panelType: 'export',
      });
      expect(useAppStore.getState().isCommandPaletteOpen).toBe(false);
    });

    act(() => {
      useAppStore.getState().openCommandPalette();
    });
    const toggleInput = screen.getByRole('combobox', { name: 'Command search' });
    fireEvent.change(toggleInput, { target: { value: 'toggle dark mode' } });
    fireEvent.keyDown(toggleInput, { key: 'Enter' });

    await waitFor(() => {
      expect(useSettingsStore.getState().global.theme).toBe('light');
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

  it('closes on backdrop click but not when clicking inside palette surface', () => {
    render(<CommandPalette />);

    act(() => {
      useAppStore.getState().openCommandPalette();
    });

    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    const backdrop = dialog.parentElement;
    expect(backdrop).toBeTruthy();

    fireEvent.mouseDown(dialog);
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();

    fireEvent.mouseDown(backdrop as HTMLElement);
    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
  });

  it('keeps tab handler inert when focus is outside palette and handles zero focusables fallback', () => {
    function Harness() {
      return (
        <div>
          <button type="button">Outside</button>
          <CommandPalette />
        </div>
      );
    }

    render(<Harness />);
    act(() => {
      useAppStore.getState().openCommandPalette();
    });

    const outside = screen.getByRole('button', { name: 'Outside' });
    outside.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(outside).toHaveFocus();

    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    const input = screen.getByRole('combobox', { name: 'Command search' });
    input.focus();

    vi.spyOn(dialog, 'querySelectorAll').mockReturnValue([] as unknown as NodeListOf<HTMLElement>);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(dialog).toHaveFocus();
  });

  it('handles closing when original trigger is removed before cleanup focus restore', () => {
    function Harness() {
      const [showTrigger, setShowTrigger] = useState(true);
      return (
        <div>
          {showTrigger ? (
            <button type="button" onClick={() => useAppStore.getState().openCommandPalette()}>
              Trigger
            </button>
          ) : null}
          <button type="button" onClick={() => setShowTrigger(false)}>
            Remove trigger
          </button>
          <CommandPalette />
        </div>
      );
    }

    render(<Harness />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Remove trigger' }));
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Command search' }), {
      key: 'Escape',
    });

    expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
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

  it('resets an out-of-range highlight index back to the first result', async () => {
    render(<CommandPalette />);

    act(() => {
      useAppStore.setState({
        commandPaletteHighlightedIndex: 999,
      });
      useAppStore.getState().openCommandPalette();
    });

    await waitFor(() => {
      expect(useAppStore.getState().commandPaletteHighlightedIndex).toBe(0);
    });
  });
});
