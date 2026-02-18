import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readStyleFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('design token stylesheets', () => {
  it('defines core spacing, radius, and motion tokens', () => {
    const css = readStyleFile('src/styles/tokens.css');

    expect(css).toContain('--space-1: 0.25rem;');
    expect(css).toContain('--space-sidebar-width: 240px;');
    expect(css).toContain('--radius-md: 6px;');
    expect(css).toContain('--duration-normal: 150ms;');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('defines light and dark theme selectors with core color tokens', () => {
    const lightCss = readStyleFile('src/styles/themes/light.css');
    const darkCss = readStyleFile('src/styles/themes/dark.css');

    expect(lightCss).toContain("[data-theme='light']");
    expect(lightCss).toContain('--color-bg-primary: #ffffff;');
    expect(lightCss).toContain('--color-accent-default: hsl(var(--color-accent-h), var(--color-accent-s), 45%);');
    expect(lightCss).toContain('--shadow-focus:');

    expect(darkCss).toContain("[data-theme='dark']");
    expect(darkCss).toContain('--color-bg-primary: #161618;');
    expect(darkCss).toContain('--color-accent-default: hsl(var(--color-accent-h), var(--color-accent-s), 60%);');
    expect(darkCss).toContain('--shadow-focus:');
  });
});
