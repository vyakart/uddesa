import fs from 'node:fs';
import path from 'node:path';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('responsive layout baselines', () => {
  it('keeps shelf grid on 4/3/2 breakpoints with minimum card widths', () => {
    const css = read('src/styles/shell.css');

    expect(css).toContain('grid-template-columns: repeat(2, minmax(180px, 1fr));');
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('grid-template-columns: repeat(3, minmax(200px, 1fr));');
    expect(css).toContain('@media (min-width: 960px)');
    expect(css).toContain('grid-template-columns: repeat(4, minmax(200px, 1fr));');
  });

  it('defines overlay drawer treatment for sidebar below compact widths', () => {
    const css = read('src/styles/shell.css');

    expect(css).toContain(".muwi-shell[data-sidebar-overlay='true'] .muwi-sidebar-shell");
    expect(css).toContain('.muwi-shell-sidebar-backdrop');
  });

  it('enforces Electron minimum window size of 800x600', () => {
    const electronMain = read('electron/main.ts');

    expect(electronMain).toContain('minWidth: 800');
    expect(electronMain).toContain('minHeight: 600');
  });
});
