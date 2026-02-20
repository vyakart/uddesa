import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type RGB = { r: number; g: number; b: number };

function parseCssVars(css: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const matches = css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi);
  for (const match of matches) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;
  const value = Number.parseInt(expanded, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const sat = s / 100;
  const light = l / 100;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const second = chroma * (1 - Math.abs((h / 60) % 2 - 1));
  const match = light - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (h < 60) {
    red = chroma;
    green = second;
  } else if (h < 120) {
    red = second;
    green = chroma;
  } else if (h < 180) {
    green = chroma;
    blue = second;
  } else if (h < 240) {
    green = second;
    blue = chroma;
  } else if (h < 300) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}

function rgbaToRgb(value: string, background: RGB): RGB {
  const match = value.match(
    /rgba\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9.]+)\s*\)/i
  );
  if (!match) {
    throw new Error(`Unsupported rgba value: ${value}`);
  }

  const [, r, g, b, alpha] = match;
  const opacity = Number.parseFloat(alpha);
  const red = Number.parseInt(r, 10);
  const green = Number.parseInt(g, 10);
  const blue = Number.parseInt(b, 10);

  return {
    r: Math.round(red * opacity + background.r * (1 - opacity)),
    g: Math.round(green * opacity + background.g * (1 - opacity)),
    b: Math.round(blue * opacity + background.b * (1 - opacity)),
  };
}

function resolveThemeColor(
  vars: Record<string, string>,
  tokens: Record<string, string>,
  name: string,
  background: RGB
): RGB {
  const value = vars[name];
  if (!value) {
    throw new Error(`Missing css variable: ${name}`);
  }

  if (value.startsWith('#')) {
    return hexToRgb(value);
  }

  if (value.startsWith('rgba(')) {
    return rgbaToRgb(value, background);
  }

  const accentMatch = value.match(
    /hsl\(var\(--color-accent-h\),\s*var\(--color-accent-s\),\s*([0-9.]+)%\)/i
  );
  if (accentMatch) {
    const hue = Number.parseFloat(tokens['color-accent-h']);
    const sat = Number.parseFloat(tokens['color-accent-s']);
    const light = Number.parseFloat(accentMatch[1]);
    return hslToRgb(hue, sat, light);
  }

  throw new Error(`Unsupported color format for ${name}: ${value}`);
}

function srgbToLinear(channel: number): number {
  const unit = channel / 255;
  return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
}

function luminance(color: RGB): number {
  return 0.2126 * srgbToLinear(color.r) + 0.7152 * srgbToLinear(color.g) + 0.0722 * srgbToLinear(color.b);
}

function contrastRatio(foreground: RGB, background: RGB): number {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function expectContrastAtLeast(foreground: RGB, background: RGB, minimum: number) {
  expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
}

describe('theme contrast', () => {
  const lightCss = readFileSync(resolve(process.cwd(), 'src/styles/themes/light.css'), 'utf8');
  const darkCss = readFileSync(resolve(process.cwd(), 'src/styles/themes/dark.css'), 'utf8');
  const tokenCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

  const lightVars = parseCssVars(lightCss);
  const darkVars = parseCssVars(darkCss);
  const tokenVars = parseCssVars(tokenCss);

  it('meets WCAG 4.5:1 for primary and secondary body text', () => {
    const lightBg = resolveThemeColor(lightVars, tokenVars, 'color-bg-primary', hexToRgb('#ffffff'));
    const darkBg = resolveThemeColor(darkVars, tokenVars, 'color-bg-primary', hexToRgb('#000000'));

    expectContrastAtLeast(
      resolveThemeColor(lightVars, tokenVars, 'color-text-primary', lightBg),
      lightBg,
      4.5
    );
    expectContrastAtLeast(
      resolveThemeColor(lightVars, tokenVars, 'color-text-secondary', lightBg),
      lightBg,
      4.5
    );

    expectContrastAtLeast(
      resolveThemeColor(darkVars, tokenVars, 'color-text-primary', darkBg),
      darkBg,
      4.5
    );
    expectContrastAtLeast(
      resolveThemeColor(darkVars, tokenVars, 'color-text-secondary', darkBg),
      darkBg,
      4.5
    );
  });

  it('meets control contrast for inverse text on accent buttons', () => {
    const lightBg = resolveThemeColor(lightVars, tokenVars, 'color-accent-default', hexToRgb('#ffffff'));
    const darkBg = resolveThemeColor(darkVars, tokenVars, 'color-accent-default', hexToRgb('#000000'));

    expectContrastAtLeast(
      resolveThemeColor(lightVars, tokenVars, 'color-text-inverse', lightBg),
      lightBg,
      4.5
    );
    expectContrastAtLeast(
      resolveThemeColor(darkVars, tokenVars, 'color-text-inverse', darkBg),
      darkBg,
      4.5
    );
  });

  it('keeps note/status surfaces readable with non-color-only indicators', () => {
    const lightBg = resolveThemeColor(lightVars, tokenVars, 'color-bg-primary', hexToRgb('#ffffff'));
    const darkBg = resolveThemeColor(darkVars, tokenVars, 'color-bg-primary', hexToRgb('#000000'));

    const lightWarningSurface = resolveThemeColor(lightVars, tokenVars, 'color-warning-subtle', lightBg);
    const darkWarningSurface = resolveThemeColor(darkVars, tokenVars, 'color-warning-subtle', darkBg);

    expectContrastAtLeast(
      resolveThemeColor(lightVars, tokenVars, 'color-text-primary', lightWarningSurface),
      lightWarningSurface,
      4.5
    );
    expectContrastAtLeast(
      resolveThemeColor(darkVars, tokenVars, 'color-text-primary', darkWarningSurface),
      darkWarningSurface,
      4.5
    );
  });
});
