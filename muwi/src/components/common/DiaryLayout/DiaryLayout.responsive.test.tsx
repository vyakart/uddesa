import { act, render, screen, setupUser, waitFor } from '@/test';
import { useAppStore } from '@/stores/appStore';
import { DiaryLayout } from './DiaryLayout';

function resizeWindow(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

describe('DiaryLayout responsive behavior', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  afterEach(() => {
    resizeWindow(originalInnerWidth);
  });

  it('maps shell widths to wide, standard, compact, and overlay bands', () => {
    resizeWindow(1280);
    useAppStore.getState().openDiary('drafts');

    render(
      <DiaryLayout diaryType="drafts" sidebar={<p>Sidebar content</p>} rightPanel={<p>Panel body</p>}>
        <p>Canvas slot</p>
      </DiaryLayout>
    );

    const shell = screen.getByTestId('diary-shell');
    expect(shell).toHaveAttribute('data-shell-breakpoint', 'wide');
    expect(shell).toHaveAttribute('data-sidebar-overlay', 'false');

    resizeWindow(1100);
    expect(shell).toHaveAttribute('data-shell-breakpoint', 'standard');

    resizeWindow(900);
    expect(shell).toHaveAttribute('data-shell-breakpoint', 'compact');

    resizeWindow(760);
    expect(shell).toHaveAttribute('data-shell-breakpoint', 'overlay');
    expect(shell).toHaveAttribute('data-sidebar-overlay', 'true');
  });

  it('auto-collapses sidebar in compact widths when right panel opens', () => {
    resizeWindow(900);
    useAppStore.getState().openDiary('drafts');

    render(
      <DiaryLayout diaryType="drafts" sidebar={<p>Sidebar content</p>} rightPanel={<p>Panel body</p>}>
        <p>Canvas slot</p>
      </DiaryLayout>
    );

    const sidebarShell = screen.getByTestId('shared-sidebar-shell');
    expect(sidebarShell).toHaveAttribute('data-open', 'true');

    act(() => {
      useAppStore.getState().openRightPanel('outline');
    });

    expect(sidebarShell).toHaveAttribute('data-open', 'false');
    expect(screen.getByText('Panel body')).toBeInTheDocument();
  });

  it('renders sidebar as overlay below 800px and lets backdrop close it', async () => {
    const user = setupUser();
    resizeWindow(760);
    useAppStore.getState().openDiary('drafts');

    render(
      <DiaryLayout diaryType="drafts" sidebar={<p>Sidebar content</p>}>
        <p>Canvas slot</p>
      </DiaryLayout>
    );

    expect(screen.getByTestId('shared-sidebar-shell')).toHaveAttribute('data-open', 'true');

    const backdrop = screen.getByTestId('sidebar-overlay-backdrop');
    await user.click(backdrop);

    expect(screen.getByTestId('shared-sidebar-shell')).toHaveAttribute('data-open', 'false');
    expect(screen.queryByTestId('sidebar-overlay-backdrop')).not.toBeInTheDocument();
  });

  it('moves focus into sidebar overlay and restores focus to toggle on Escape', async () => {
    const user = setupUser();
    resizeWindow(760);
    useAppStore.getState().openDiary('drafts');

    render(
      <DiaryLayout diaryType="drafts" sidebar={<p>Sidebar content</p>}>
        <p>Canvas slot</p>
      </DiaryLayout>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to shelf' })).toHaveFocus();
    });

    await user.click(screen.getByTestId('sidebar-overlay-backdrop'));
    const expandButton = screen.getByTestId('diary-sidebar-open-button');

    expandButton.focus();
    expect(expandButton).toHaveFocus();

    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to shelf' })).toHaveFocus();
    });

    await user.keyboard('{Escape}');

    expect(screen.getByTestId('shared-sidebar-shell')).toHaveAttribute('data-open', 'false');
    await waitFor(() => {
      expect(screen.getByTestId('diary-sidebar-open-button')).toHaveFocus();
    });
  });
});
