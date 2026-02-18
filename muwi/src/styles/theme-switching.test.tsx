import { describe, expect, it } from 'vitest';
import {
  applyThemeToDocument,
  getSystemPrefersDark,
  resolveTheme,
  watchSystemTheme,
} from '@/utils/theme';

describe('theme utilities', () => {
  it('resolves explicit and system modes correctly', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('applies effective theme to document root', () => {
    applyThemeToDocument('dark');

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    applyThemeToDocument('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('reads system preference and returns an unsubscribe handler for watcher', () => {
    const initial = getSystemPrefersDark();
    expect(typeof initial).toBe('boolean');

    const unsubscribe = watchSystemTheme(() => undefined);
    expect(typeof unsubscribe).toBe('function');

    unsubscribe();
  });
});
