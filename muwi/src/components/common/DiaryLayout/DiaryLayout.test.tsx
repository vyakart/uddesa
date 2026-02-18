import { act, render, screen, setupUser } from '@/test';
import { useAppStore } from '@/stores/appStore';
import { DiaryLayout } from './DiaryLayout';

describe('DiaryLayout', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  it('supports sidebar collapse and expand through shell controls', async () => {
    const user = setupUser();
    const state = useAppStore.getState();
    state.openDiary('drafts');

    render(
      <DiaryLayout
        diaryType="drafts"
        sidebar={<p>Sidebar content</p>}
        toolbar={<p>Toolbar slot</p>}
      >
        <p>Canvas slot</p>
      </DiaryLayout>
    );

    const sidebarShell = screen.getByTestId('shared-sidebar-shell');
    expect(sidebarShell).toHaveAttribute('data-open', 'true');

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(sidebarShell).toHaveAttribute('data-open', 'false');

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(sidebarShell).toHaveAttribute('data-open', 'true');
  });

  it('mounts and unmounts the right panel from app store state', () => {
    const state = useAppStore.getState();
    state.openDiary('drafts');

    render(
      <DiaryLayout diaryType="drafts" rightPanel={<p>Panel body</p>}>
        <p>Canvas slot</p>
      </DiaryLayout>
    );

    expect(screen.queryByText('Panel body')).not.toBeInTheDocument();

    act(() => {
      useAppStore.getState().openRightPanel('outline');
    });
    expect(screen.getByText('Panel body')).toBeInTheDocument();

    act(() => {
      useAppStore.getState().closeRightPanel();
    });
    expect(screen.queryByText('Panel body')).not.toBeInTheDocument();
  });

  it('renders toolbar and status slots', () => {
    const state = useAppStore.getState();
    state.openDiary('drafts');

    render(
      <DiaryLayout
        diaryType="drafts"
        toolbar={<span>Toolbar slot</span>}
        status={{ left: <span>Left status</span>, right: <span>Right status</span> }}
      >
        <p>Canvas slot</p>
      </DiaryLayout>
    );

    expect(screen.getByText('Toolbar slot')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Left status')).toBeInTheDocument();
    expect(screen.getByText('Right status')).toBeInTheDocument();
  });
});
