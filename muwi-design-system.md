# MUWI Design System & Aesthetic Specification
## Low-Level Visual Design Document for Implementation

*Version 2.0 — February 2026*
*Supersedes: Section 6 of original design doc*

---

## 0. How to Read This Document

This document is the single source of truth for every visual decision in MUWI. It is organized from abstract (philosophy, principles) to concrete (pixel values, component specs). When implementing, start from the token system and work outward to components.

**Naming convention for tokens**: `--{category}-{property}-{variant}` (e.g., `--color-text-secondary`, `--space-panel-padding`).

**Scope**: This document covers the visual layer only. It does not redefine data models, routing, or business logic — those remain in the original design doc and TASKS.md.

---

## 1. Design Philosophy

### 1.1 Identity Statement

MUWI's visual identity is **Quiet Precision** — every element earns its place, the interface recedes to let writing be the focal point, and power is discovered through use rather than displayed upfront.

This is not minimalism for its own sake. It's the principle that a writing tool's job is to disappear. The best session in MUWI is one where the user forgets they're using software.

### 1.2 Core Design Principles

**1. Progressive Disclosure (Linear model)**
Show exactly what the user needs at their current depth of engagement. The shelf shows diary types. Opening a diary reveals its sidebar. Interacting with content surfaces its toolbar. Power features live in the command palette. Nothing is hidden — but nothing competes for attention either.

**2. Structural Consistency, Contextual Content (Figma model)**
The spatial layout — where the sidebar is, where the toolbar sits, where the status bar lives — is identical across all six diary types. Only the *contents* of those regions change. Users build spatial memory once and carry it everywhere.

**3. Typographic Hierarchy Over Decorative Elements (iA Writer model)**
Use font weight, size, and color to create visual hierarchy. Not boxes, not borders, not background colors. When a border or background *is* used, it carries meaning (e.g., the active state, a locked element, a category). Decorative elements are earned, never default.

**4. High Data-Ink Ratio (Tufte principle)**
Every pixel on screen is either content or helps the user understand content. Measure the interface by what you can remove, not what you can add. If an element doesn't help the user write, read, or navigate — it doesn't belong.

**5. Calm Computing, Not Dead Computing**
The interface should feel alive but quiet. Transitions exist but are fast and purposeful. Hover states provide feedback without celebration. The app feels responsive and present, not static or laggy, but never demands attention it hasn't earned.

### 1.3 Anti-Patterns (Things MUWI Should Never Do)

- Colorful gradients, glowing effects, or "hero" visual treatments on UI chrome
- Animations longer than 300ms for standard interactions
- Decorative illustrations or mascots
- Rounded "pill" shapes on primary UI elements (reserve for tags/badges only)
- Drop shadows heavier than `0 1px 3px` on persistent UI elements
- Text smaller than 12px anywhere in the interface
- More than one accent color visible at the same time on a single screen
- Toolbars or panels that cannot be collapsed or dismissed
- Loading spinners that spin for more than 200ms without content (use skeleton states)

### 1.4 Design Inspirations — What to Borrow, What to Leave

| Source | Borrow | Leave Behind |
|--------|--------|--------------|
| **Linear** | Keyboard-first navigation, sidebar weight hierarchy, muted palette with single accent, command palette pattern | Their aggressive animations, branded purple tint |
| **Figma** | Structural layout consistency across modes, panel system, toolbar grouping | Complex inspector UI, collaborative presence indicators |
| **iA Writer** | Typography-driven hierarchy, focus mode, content-width constraints | Extreme minimalism (MUWI needs more chrome for 6 diary types) |
| **Google Docs** | Toolbar icon density and grouping, status bar pattern, "page" canvas feel | Collaborative features, Google branding, menu-bar paradigm |
| **Fileverse** | Clean single-page editor, `/` command pattern, breathing whitespace | Web3 branding, login/sharing features |
| **VS Code** | Command palette, sidebar icon rail, panel toggling, keyboard shortcut system | Syntax highlighting aesthetics, terminal integration |
| **Notion** | Sidebar navigation tree, block-level interaction model | Template gallery, database views, social features |

---

## 2. Design Token System

All visual values are expressed as CSS custom properties. No magic numbers in component code. Every value traces back to this token set.

### 2.1 Spacing Scale (4px base)

```css
:root {
  --space-0: 0;
  --space-px: 1px;
  --space-0-5: 0.125rem;  /* 2px  */
  --space-1: 0.25rem;     /* 4px  */
  --space-1-5: 0.375rem;  /* 6px  */
  --space-2: 0.5rem;      /* 8px  */
  --space-3: 0.75rem;     /* 12px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-8: 2rem;        /* 32px */
  --space-10: 2.5rem;     /* 40px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
}
```

**Semantic spacing aliases** (use these in components, not raw scale):

```css
:root {
  /* Component internals */
  --space-inset-tight: var(--space-1) var(--space-2);       /* 4px 8px — compact buttons, tags */
  --space-inset-default: var(--space-2) var(--space-3);     /* 8px 12px — standard buttons, inputs */
  --space-inset-relaxed: var(--space-3) var(--space-4);     /* 12px 16px — cards, panels */
  --space-inset-spacious: var(--space-4) var(--space-6);    /* 16px 24px — modal bodies, sections */

  /* Gaps between related items */
  --space-gap-tight: var(--space-1);     /* 4px — icon + label */
  --space-gap-default: var(--space-2);   /* 8px — list items, button groups */
  --space-gap-relaxed: var(--space-4);   /* 16px — card grid, form fields */
  --space-gap-spacious: var(--space-6);  /* 24px — page sections */

  /* Layout regions */
  --space-sidebar-width: 240px;
  --space-sidebar-collapsed: 48px;
  --space-toolbar-height: 44px;
  --space-statusbar-height: 28px;
  --space-titlebar-height: 38px;
  --space-canvas-max-width: 720px;       /* ~65ch at 16px body text */
  --space-canvas-wide-max-width: 960px;  /* for Academic/Long Drafts */
  --space-panel-width: 280px;            /* right panel: bibliography, index */
}
```

### 2.2 Border Radius

```css
:root {
  --radius-sm: 3px;    /* inputs, small controls */
  --radius-md: 6px;    /* buttons, cards, dropdowns */
  --radius-lg: 8px;    /* modals, panels, diary cards */
  --radius-xl: 12px;   /* large containers, settings modal */
  --radius-full: 9999px; /* badges, tags, avatar indicators */
}
```

Design note: MUWI uses *slightly* rounded corners — not sharp (too cold), not pill-shaped (too playful). The 6px default is the anchor.

### 2.3 Shadows

```css
:root {
  /* Elevation levels — think of these as physical height above the surface */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.06),
               0 1px 2px -1px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07),
               0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08),
               0 4px 6px -4px rgba(0, 0, 0, 0.03);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08),
               0 8px 10px -6px rgba(0, 0, 0, 0.02);

  /* Specific use cases */
  --shadow-toolbar: 0 1px 0 0 rgba(0, 0, 0, 0.06);       /* 1px bottom line feel */
  --shadow-sidebar: 1px 0 0 0 rgba(0, 0, 0, 0.06);       /* 1px right line feel */
  --shadow-dropdown: var(--shadow-lg);
  --shadow-modal: var(--shadow-xl);
  --shadow-card-rest: var(--shadow-xs);
  --shadow-card-hover: var(--shadow-sm);
  --shadow-focus: 0 0 0 2px var(--color-bg-primary),
                  0 0 0 4px var(--color-accent-default);   /* double-ring focus */
}
```

Design note: Shadows in MUWI are almost invisible at rest. They exist to separate overlapping layers (dropdowns, modals), not to add depth to flat layouts. Persistent UI elements (sidebar, toolbar) use 1px borders or box-shadows, never lifted shadows.

### 2.4 Z-Index Scale

```css
:root {
  --z-base: 0;
  --z-sidebar: 10;
  --z-toolbar: 20;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 400;
  --z-modal: 500;
  --z-command-palette: 600;
  --z-toast: 700;
  --z-tooltip: 800;
}
```

### 2.5 Transitions

```css
:root {
  /* Durations */
  --duration-instant: 50ms;
  --duration-fast: 100ms;
  --duration-normal: 150ms;
  --duration-moderate: 200ms;
  --duration-slow: 300ms;

  /* Easings */
  --ease-default: cubic-bezier(0.2, 0, 0, 1);    /* fast-out, slow-in — the primary easing */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);          /* accelerating — for exits */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);         /* decelerating — for entrances */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* overshoot — very sparingly */

  /* Precomposed transitions */
  --transition-colors: color var(--duration-fast) var(--ease-default),
                       background-color var(--duration-fast) var(--ease-default),
                       border-color var(--duration-fast) var(--ease-default);
  --transition-opacity: opacity var(--duration-normal) var(--ease-default);
  --transition-transform: transform var(--duration-normal) var(--ease-out);
  --transition-shadow: box-shadow var(--duration-normal) var(--ease-default);
  --transition-sidebar: width var(--duration-slow) var(--ease-default),
                        transform var(--duration-slow) var(--ease-default);
}

/* Global motion reduction */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 3. Color System

### 3.1 Design Rationale

MUWI's color palette is intentionally restrained. The interface uses a near-monochrome base (grays and off-whites) with a single configurable accent color. Diary-specific colors exist only where they carry semantic meaning (Scratchpad categories, status indicators). The writing canvas is always the brightest, most prominent surface — everything around it is quieter.

### 3.2 Light Theme Tokens

```css
:root, [data-theme="light"] {
  /* ---- Backgrounds ---- */
  --color-bg-primary: #FFFFFF;           /* main app background behind everything */
  --color-bg-secondary: #F8F8F8;         /* sidebar, panels, settings */
  --color-bg-tertiary: #F1F1F1;          /* hover states on secondary surfaces */
  --color-bg-canvas: #FFFFFF;            /* the writing surface */
  --color-bg-canvas-warm: #FFFDF8;       /* warm paper variant (Personal Diary default) */
  --color-bg-elevated: #FFFFFF;          /* modals, dropdowns, floating elements */
  --color-bg-sunken: #F4F4F4;           /* inset areas, code blocks, disabled fields */
  --color-bg-overlay: rgba(0, 0, 0, 0.4); /* backdrop behind modals */

  /* ---- Text ---- */
  --color-text-primary: #1C1C1E;         /* body text, headings */
  --color-text-secondary: #6B6B6F;       /* labels, descriptions, metadata */
  --color-text-tertiary: #9A9A9E;        /* placeholders, disabled text, timestamps */
  --color-text-inverse: #FFFFFF;         /* text on dark/accent backgrounds */
  --color-text-on-canvas: #1C1C1E;       /* text within the writing area */

  /* ---- Borders ---- */
  --color-border-default: #E5E5E7;       /* structural borders: sidebar, toolbar */
  --color-border-subtle: #EEEEEF;        /* card outlines, input borders at rest */
  --color-border-strong: #D1D1D3;        /* focused inputs, emphasized dividers */
  --color-border-on-canvas: #E8E8EA;     /* rulers, page breaks on the canvas */

  /* ---- Accent (user-configurable base hue) ---- */
  --color-accent-h: 200;                 /* default hue: a calm, muted teal-blue */
  --color-accent-s: 30%;                 /* low saturation — not aggressive */
  --color-accent-default: hsl(var(--color-accent-h), var(--color-accent-s), 45%);
  --color-accent-hover: hsl(var(--color-accent-h), var(--color-accent-s), 38%);
  --color-accent-subtle: hsl(var(--color-accent-h), var(--color-accent-s), 95%);
  --color-accent-text: hsl(var(--color-accent-h), var(--color-accent-s), 35%);

  /* ---- Semantic ---- */
  --color-success: #34A853;
  --color-success-subtle: #E8F5E9;
  --color-warning: #E8A318;
  --color-warning-subtle: #FFF8E1;
  --color-error: #D93025;
  --color-error-subtle: #FDECEA;
  --color-info: #4285F4;
  --color-info-subtle: #E8F0FE;
  --color-locked: #9E9E9E;
  --color-locked-bg: rgba(158, 158, 158, 0.08);

  /* ---- Interactive states (applied via classes, not inline) ---- */
  --color-hover-overlay: rgba(0, 0, 0, 0.04);    /* generic hover darkening */
  --color-active-overlay: rgba(0, 0, 0, 0.07);   /* generic press/active darkening */
  --color-selected-bg: var(--color-accent-subtle);
  --color-focus-ring: var(--color-accent-default);
}
```

### 3.3 Dark Theme Tokens

```css
[data-theme="dark"] {
  /* ---- Backgrounds ---- */
  --color-bg-primary: #161618;
  --color-bg-secondary: #1C1C1E;
  --color-bg-tertiary: #242426;
  --color-bg-canvas: #1E1E20;
  --color-bg-canvas-warm: #1F1E1B;
  --color-bg-elevated: #242426;
  --color-bg-sunken: #131315;
  --color-bg-overlay: rgba(0, 0, 0, 0.6);

  /* ---- Text ---- */
  --color-text-primary: #E5E5E7;
  --color-text-secondary: #9A9A9E;
  --color-text-tertiary: #6B6B6F;
  --color-text-inverse: #1C1C1E;
  --color-text-on-canvas: #E5E5E7;

  /* ---- Borders ---- */
  --color-border-default: #2C2C2E;
  --color-border-subtle: #242426;
  --color-border-strong: #3A3A3C;
  --color-border-on-canvas: #2C2C2E;

  /* ---- Accent (same hue, adjusted lightness for dark) ---- */
  --color-accent-default: hsl(var(--color-accent-h), var(--color-accent-s), 60%);
  --color-accent-hover: hsl(var(--color-accent-h), var(--color-accent-s), 68%);
  --color-accent-subtle: hsl(var(--color-accent-h), var(--color-accent-s), 15%);
  --color-accent-text: hsl(var(--color-accent-h), var(--color-accent-s), 65%);

  /* ---- Semantic (adjusted for dark) ---- */
  --color-success: #57D27A;
  --color-success-subtle: rgba(87, 210, 122, 0.12);
  --color-warning: #F5C543;
  --color-warning-subtle: rgba(245, 197, 67, 0.12);
  --color-error: #F28B82;
  --color-error-subtle: rgba(242, 139, 130, 0.12);
  --color-info: #8AB4F8;
  --color-info-subtle: rgba(138, 180, 248, 0.12);
  --color-locked: #757575;
  --color-locked-bg: rgba(117, 117, 117, 0.1);

  /* ---- Interactive ---- */
  --color-hover-overlay: rgba(255, 255, 255, 0.06);
  --color-active-overlay: rgba(255, 255, 255, 0.09);
  --color-selected-bg: var(--color-accent-subtle);
  --color-focus-ring: var(--color-accent-default);

  /* ---- Shadow overrides for dark mode ---- */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3),
               0 1px 2px -1px rgba(0, 0, 0, 0.15);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.35),
               0 2px 4px -2px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4),
               0 4px 6px -4px rgba(0, 0, 0, 0.2);
  --shadow-toolbar: 0 1px 0 0 var(--color-border-default);
  --shadow-sidebar: 1px 0 0 0 var(--color-border-default);
}
```

### 3.4 Blackboard Diary Colors

The Blackboard is the one diary that always uses a dark canvas, even in light theme. Its chrome (sidebar, toolbar) follows the current app theme, but the canvas area uses these dedicated tokens:

```css
:root {
  --color-bb-canvas: #2D3436;
  --color-bb-canvas-grid: rgba(255, 255, 255, 0.04);
  --color-bb-text: #F0F0F0;
  --color-bb-stroke-default: rgba(255, 255, 255, 0.7);
  --color-bb-accent: #74B9FF;
}
```

### 3.5 Scratchpad Category Colors

These are used for the page background tint in the Scratchpad. They need to work in both light and dark themes. In dark theme, these become subtle tints on the dark canvas rather than full page fills.

```css
:root {
  --color-cat-ideas: #FFF9C4;
  --color-cat-ideas-dark: rgba(255, 249, 196, 0.08);
  --color-cat-todos: #C8E6C9;
  --color-cat-todos-dark: rgba(200, 230, 201, 0.08);
  --color-cat-notes: #BBDEFB;
  --color-cat-notes-dark: rgba(187, 222, 251, 0.08);
  --color-cat-questions: #E1BEE7;
  --color-cat-questions-dark: rgba(225, 190, 231, 0.08);
  --color-cat-misc: #F5F5F5;
  --color-cat-misc-dark: rgba(245, 245, 245, 0.05);
}
```

### 3.6 Status Colors for Draft Management

```css
:root {
  --color-status-in-progress: var(--color-accent-default);
  --color-status-review: var(--color-warning);
  --color-status-complete: var(--color-success);
}
```

---

## 4. Typography System

### 4.1 Font Stack Strategy

MUWI uses a two-tier font system: **chrome fonts** for the application UI, and **content fonts** for the writing canvas. This separation ensures the app always feels consistent while giving users full control over their writing experience.

**Chrome (UI) — Geist Sans**

Geist is Vercel's open-source typeface. It has the neutrality of Inter but with slightly more character — geometric letterforms with humanist touches, excellent at small sizes, and a personality that feels "tool-like" without being cold. It's available via `@fontsource/geist-sans`.

Fallback stack: `'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`

If bundling Geist is impractical, the fallback position is the system font stack. Do NOT fall back to Inter for chrome — it's reserved for content.

**Chrome (Monospace, UI) — Geist Mono**

For keyboard shortcut labels, code snippets in settings, and the command palette input.

Fallback stack: `'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace`

**Content (Writing canvas) — User-configurable from bundled set:**

| Font | Category | Best For | Character |
|------|----------|----------|-----------|
| Inter | Sans-serif | Drafts, Academic | Clean, neutral, excellent readability |
| Crimson Pro | Serif | Personal Diary, Long Drafts | Warm, literary, classical |
| JetBrains Mono | Monospace | Scratchpad (optional) | Technical, structured |
| Caveat | Handwriting | Scratchpad, Blackboard | Casual, personal, sketch-feel |

Users configure their preferred content font per diary type in settings. The diary's writing canvas uses that font. The UI chrome around it always uses Geist.

### 4.2 Type Scale

```css
:root {
  /* Chrome type scale (UI elements) */
  --font-size-xs: 0.6875rem;     /* 11px — keyboard shortcuts, badges */
  --font-size-sm: 0.75rem;       /* 12px — labels, metadata, sidebar items */
  --font-size-base: 0.8125rem;   /* 13px — primary UI text, buttons, menus */
  --font-size-md: 0.875rem;      /* 14px — prominent labels, section headers in sidebar */
  --font-size-lg: 1rem;          /* 16px — modal titles, card titles */
  --font-size-xl: 1.25rem;       /* 20px — page headings, shelf title */
  --font-size-2xl: 1.5rem;       /* 24px — large display, welcome state */

  /* Content type scale (writing canvas) — slightly larger for readability */
  --content-font-size-body: 1rem;       /* 16px — default body text */
  --content-font-size-small: 0.875rem;  /* 14px — footnotes, captions */
  --content-font-size-h3: 1.125rem;     /* 18px */
  --content-font-size-h2: 1.375rem;     /* 22px */
  --content-font-size-h1: 1.75rem;      /* 28px */
  --content-font-size-title: 2.25rem;   /* 36px — document titles */

  /* Line heights */
  --leading-tight: 1.25;          /* headings, titles */
  --leading-snug: 1.35;           /* UI text, sidebar items */
  --leading-normal: 1.5;          /* body content default */
  --leading-relaxed: 1.75;        /* diary entries, long reading */
  --leading-loose: 2.0;           /* double-spaced academic */

  /* Letter spacing */
  --tracking-tighter: -0.02em;    /* large headings */
  --tracking-tight: -0.01em;      /* titles */
  --tracking-normal: 0;           /* body text */
  --tracking-wide: 0.01em;        /* all-caps labels, small badges */
  --tracking-wider: 0.04em;       /* section labels like "SCRATCHPAD" */

  /* Font weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* Content width constraint */
  --content-measure: 65ch;         /* optimal reading line length */
  --content-measure-wide: 80ch;    /* academic/long drafts with margins */
}
```

### 4.3 Typographic Hierarchy Rules

The following rules govern how text hierarchy is created across the app. They enforce the iA Writer principle: **weight and color, not decoration, create hierarchy.**

**In Chrome (UI):**
- Primary labels: `--font-size-base`, `--weight-medium`, `--color-text-primary`
- Secondary labels: `--font-size-sm`, `--weight-regular`, `--color-text-secondary`
- Tertiary/metadata: `--font-size-xs`, `--weight-regular`, `--color-text-tertiary`
- Active/selected: `--weight-semibold`, `--color-text-primary` (never underline, never color alone)
- Section headers in sidebar: `--font-size-xs`, `--weight-semibold`, `--tracking-wider`, `--color-text-tertiary`, `text-transform: uppercase`

**In Content (Canvas):**
- Body text: content font at `--content-font-size-body`, `--weight-regular`, `--leading-normal`
- H1: `--content-font-size-h1`, `--weight-bold`, `--leading-tight`, `--tracking-tighter`
- H2: `--content-font-size-h2`, `--weight-semibold`, `--leading-tight`, `--tracking-tight`
- H3: `--content-font-size-h3`, `--weight-semibold`, `--leading-snug`
- Title: `--content-font-size-title`, `--weight-bold`, `--leading-tight`, `--tracking-tighter`

**Never:**
- Mix chrome font and content font within the same visual block
- Use color alone to distinguish heading levels (use size + weight)
- Use italic as a structural element (reserve for emphasis within text)

---

## 5. Iconography

### 5.1 Icon System

MUWI uses **Lucide** icons exclusively. Lucide is an open-source icon set (fork of Feather) with a consistent 24×24 grid, 1.5px stroke weight, and rounded caps. It covers all the actions MUWI needs and maintains visual consistency without the jarring personality shifts of emoji.

**Default rendering:**
- Size: 16×16 for inline/toolbar, 20×20 for sidebar navigation, 24×24 for shelf cards
- Stroke: 1.5px (Lucide default)
- Color: `currentColor` (inherits from parent text color)

### 5.2 Diary Type Icons

Each diary type is represented by a single Lucide icon. These replace the current emoji.

| Diary | Icon Name | Lucide Component | Rationale |
|-------|-----------|------------------|-----------|
| Scratchpad | `sticky-note` | `<StickyNote />` | Quick capture, disposable notes |
| Blackboard | `layout-dashboard` | `<LayoutDashboard />` | Spatial canvas, idea mapping |
| Personal Diary | `book-open` | `<BookOpen />` | Journaling, daily entries |
| Drafts | `pen-line` | `<PenLine />` | Writing, composing |
| Long Drafts | `file-text` | `<FileText />` | Structured documents |
| Academic Papers | `graduation-cap` | `<GraduationCap />` | Academic work |

### 5.3 Common Action Icons

| Action | Icon | Context |
|--------|------|---------|
| Settings | `settings` | Shelf header |
| Back to shelf | `arrow-left` | Diary header |
| Add/new | `plus` | New page, entry, draft |
| Search | `search` | Command palette, search bar |
| Lock | `lock` | Locked content indicator |
| Unlock | `unlock` | Unlock action |
| Export | `download` | Export panel |
| Collapse sidebar | `panel-left-close` | Sidebar toggle |
| Expand sidebar | `panel-left-open` | Sidebar toggle |
| More options | `more-horizontal` | Overflow menus |
| Delete | `trash-2` | Destructive actions |
| Calendar | `calendar` | Date picker |
| Bold | `bold` | Formatting toolbar |
| Italic | `italic` | Formatting toolbar |
| Underline | `underline` | Formatting toolbar |
| Strikethrough | `strikethrough` | Formatting toolbar |
| Link | `link` | Insert link |
| List (bullet) | `list` | Formatting toolbar |
| List (ordered) | `list-ordered` | Formatting toolbar |
| Quote | `quote` | Block quote |
| Code | `code` | Inline code |
| Heading 1 | `heading-1` | Formatting toolbar |
| Heading 2 | `heading-2` | Formatting toolbar |
| Heading 3 | `heading-3` | Formatting toolbar |
| Undo | `undo-2` | Formatting toolbar |
| Redo | `redo-2` | Formatting toolbar |
| Focus mode | `maximize-2` | Long Drafts |
| Footnote | `footnote` (custom) | Long Drafts, Academic |
| Citation | `book-marked` | Academic |
| Table | `table` | Academic |
| Image | `image` | Content insertion |
| Word count | `type` | Status bar |
| Clock | `clock` | Read time in status bar |
| Check | `check` | Completed status |
| Command | `command` | Command palette hint |

---

## 6. Layout Architecture

### 6.1 The Three-Region Model

Every view in MUWI beyond the shelf follows the same spatial structure:

```
┌──────────────────────────────────────────────────────────────────┐
│ Title Bar (Electron, 38px)                                       │
├────────┬────────────────────────────────────────────────┬────────┤
│        │ Toolbar (44px)                                 │        │
│        ├────────────────────────────────────────────────┤        │
│ Side-  │                                                │ Right  │
│ bar    │                                                │ Panel  │
│        │              Canvas Area                       │        │
│ 240px  │         (writing surface)                      │ 280px  │
│ (coll- │                                                │ (only  │
│ apsi-  │                                                │ when   │
│ ble)   │                                                │ invoked│
│        │                                                │        │
│        ├────────────────────────────────────────────────┤        │
│        │ Status Bar (28px)                              │        │
├────────┴────────────────────────────────────────────────┴────────┤
```

**Rules:**
- The sidebar is ALWAYS on the left. It collapses to 0px (fully hidden) or remains at 240px. There is no "icon rail" collapsed state — this is not an IDE, it's a writing tool. When collapsed, the toggle affordance is a small button at the top-left of the toolbar area.
- The right panel is NEVER visible by default. It appears only when the user explicitly opens it (bibliography, index/outline, export, reference library). It slides in from the right at 280px width.
- The canvas area is always centered within its available horizontal space. Content within the canvas is constrained to `--content-measure` (65ch). The canvas background extends to fill the region.
- The toolbar spans the full width between sidebar and right panel.
- The status bar spans the same width as the toolbar.

### 6.2 Shelf (Homepage) Layout

The shelf breaks from the three-region model. It is a single-surface, centered layout:

```
┌──────────────────────────────────────────────────────────────────┐
│ Title Bar (Electron, 38px)                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│    MUWI                                             [⚙] [🌙/☀]  │
│    ─────                                                         │
│                                                                   │
│    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐              │
│    │  icon  │  │  icon  │  │  icon  │  │  icon  │              │
│    │ Name   │  │ Name   │  │ Name   │  │ Name   │              │
│    │ desc   │  │ desc   │  │ desc   │  │ desc   │              │
│    │ meta   │  │ meta   │  │ meta   │  │ meta   │              │
│    └────────┘  └────────┘  └────────┘  └────────┘              │
│                                                                   │
│    ┌────────┐  ┌────────┐                                        │
│    │  icon  │  │  icon  │                                        │
│    │ Name   │  │ Name   │                                        │
│    │ desc   │  │ desc   │                                        │
│    │ meta   │  │ meta   │                                        │
│    └────────┘  └────────┘                                        │
│                                                                   │
│                                                                   │
│              ⌘K to open command palette                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Shelf specifications:**
- The card grid is centered horizontally within the window, max-width 960px
- Cards are arranged in a 4-column grid at ≥1024px, 3-column at ≥768px, 2-column below
- Grid gap: `--space-gap-relaxed` (16px)
- Page padding: `--space-8` (32px) horizontal, `--space-12` (48px) top
- The "MUWI" title uses `--font-size-xl`, `--weight-semibold`, `--color-text-primary`
- Below MUWI: no subtitle. The subtitle "Multi-Utility Writing Interface" is removed. The name speaks for itself.
- A subtle command palette hint sits at the bottom: `--font-size-xs`, `--color-text-tertiary`

### 6.3 Diary Card Specification

```
┌──────────────────────────────┐
│                              │  height: auto (content-driven)
│        ◇ (icon, 24px)       │  min-height: 140px
│                              │
│     Diary Name               │  --font-size-lg, --weight-semibold
│     One-line description     │  --font-size-sm, --color-text-secondary
│                              │
│     12 entries · 2m ago      │  --font-size-xs, --color-text-tertiary
│                              │
└──────────────────────────────┘

width: 1fr (grid-driven)
padding: --space-inset-spacious (16px 24px)
border: 1px solid --color-border-subtle
border-radius: --radius-lg (8px)
background: --color-bg-primary
shadow: --shadow-card-rest

Hover state:
  background: --color-bg-primary (unchanged)
  border-color: --color-border-strong
  shadow: --shadow-card-hover
  transform: translateY(-1px)
  transition: all --duration-normal --ease-default

Active (pressed) state:
  transform: translateY(0)
  shadow: --shadow-xs

Selected / current diary (when navigating back from diary):
  border-color: --color-accent-default
  border-width: 1.5px
```

**Card metadata line**: Shows item count + relative time since last edit. Format: `{count} {entries|pages|drafts|papers} · {relative_time}`. If the diary is empty: `No entries yet`. Use `date-fns` `formatDistanceToNow`.

**Card icon**: Rendered at 24×24, `--color-text-tertiary` at rest, `--color-text-secondary` on card hover. Centered horizontally above the diary name.

**No colored card backgrounds.** The old design used light blue for Scratchpad, dark for Blackboard, etc. In the new design, all cards are identical in structure. The diary's identity comes from its icon and name, not its card color. This is cleaner and scales better.

### 6.4 Transition: Shelf → Diary

When a user clicks a diary card, the transition should feel like stepping from a lobby into a room:

1. The card receives a brief highlight (border accent, 100ms)
2. The shelf content fades out (opacity 0, 150ms, ease-in)
3. The diary interface fades in (opacity 0→1, 150ms, ease-out, 50ms delay)
4. The sidebar slides in from the left (translateX -240px → 0, 200ms, ease-out)

Total transition: ~250ms perceived. The key is that the user never sees a blank screen.

When returning to the shelf (back button), the reverse occurs but faster (200ms total). The diary card that was just open has the "selected" border state for 2 seconds to orient the user.

---

## 7. Component Specifications

### 7.1 Title Bar (Electron)

```
┌──────────────────────────────────────────────────────────────────┐
│ [● ● ●]     MUWI — {current context}                            │
└──────────────────────────────────────────────────────────────────┘
```

- Height: `--space-titlebar-height` (38px)
- Background: `--color-bg-secondary`
- Border-bottom: none (blends into toolbar or shelf header)
- `-webkit-app-region: drag` (entire bar is draggable)
- macOS: traffic lights positioned with `titleBarStyle: 'hiddenInset'`, traffic light offset `(12, 12)`
- Windows/Linux: native title bar (Electron default)
- Center text: "MUWI" when on shelf, "MUWI — Scratchpad" when in a diary. `--font-size-sm`, `--weight-medium`, `--color-text-secondary`

### 7.2 Sidebar

The sidebar is the primary navigation surface within each diary.

**Structure:**

```
┌─────────────────────────┐
│ [←] {Diary Name}   [◀▶] │  ← Header: back button + name + collapse
├─────────────────────────┤
│                         │
│ {SEARCH BAR}            │  ← Optional: appears when diary has >10 items
│                         │
│ SECTION LABEL           │  ← Uppercase, --font-size-xs, --tracking-wider
│ ├ Item 1               │
│ ├ Item 2 (active)      │  ← --color-selected-bg, --weight-medium
│ ├ Item 3               │
│ └ Item 4               │
│                         │
│ SECTION LABEL           │
│ ├ ...                   │
│                         │
├─────────────────────────┤
│ [+] New {item}          │  ← Bottom-pinned action
└─────────────────────────┘
```

**Specs:**
- Width: 240px (fixed when open)
- Background: `--color-bg-secondary`
- Right border: `1px solid --color-border-default`
- Padding: `--space-2` internal padding on all sides

**Sidebar header:**
- Back arrow (`arrow-left`, 16px) — navigates to shelf
- Diary name: `--font-size-md`, `--weight-semibold`
- Collapse button (`panel-left-close`, 16px) on the right edge
- Height: 44px (aligns with toolbar)
- Bottom border: `1px solid --color-border-default`

**Sidebar items:**
- Height: 32px
- Padding: `--space-1` vertical, `--space-3` horizontal
- Font: `--font-size-sm`, `--weight-regular`
- Color: `--color-text-secondary`
- Border-radius: `--radius-sm` (3px)
- Hover: `--color-hover-overlay` background
- Active/selected: `--color-selected-bg` background, `--color-text-primary`, `--weight-medium`
- Truncate with ellipsis if text overflows

**Sidebar content per diary:**

| Diary | Sidebar Content |
|-------|----------------|
| Scratchpad | Pages list (numbered, color dot for category) |
| Blackboard | Index/heading tree |
| Personal Diary | Date-grouped entry list with mood indicators |
| Drafts | Draft list with status dots |
| Long Drafts | Section tree (collapsible, draggable) |
| Academic Papers | Paper list → Section tree when paper selected |

### 7.3 Toolbar

The toolbar sits between the title bar and the canvas. It is the primary surface for formatting and diary-specific actions.

**Design principles (borrowing from Google Docs / Fileverse):**
- Tools are grouped by function, separated by subtle 1px dividers (not gaps)
- Icons are 16×16 at `--color-text-secondary`, becoming `--color-text-primary` on hover
- Active formatting (e.g., bold is ON) uses `--color-accent-default` icon color and `--color-accent-subtle` background on the button
- Buttons are 28×28 hit targets with 4px padding around the 16px icon
- The toolbar scrolls horizontally if it overflows (rare, but handles it gracefully)

**Structure:**

```
┌───────────────────────────────────────────────────────────────────────┐
│ [Undo][Redo] │ [Font▾][Size▾] │ [B][I][U][S] │ [H1][H2][H3] │ ... │
└───────────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Height: `--space-toolbar-height` (44px)
- Background: `--color-bg-primary`
- Bottom border: `1px solid --color-border-default`
- Horizontal padding: `--space-3` (12px) on each end
- Group separator: `1px solid --color-border-subtle`, 16px tall, centered vertically

**Toolbar groups per diary type:**

| Diary | Group 1 | Group 2 | Group 3 | Group 4 | Group 5 |
|-------|---------|---------|---------|---------|---------|
| **Scratchpad** | — | — | — | Category selector | Page: [prev][next][add] |
| **Blackboard** | Tool select | Stroke color, width | Font selector | — | Zoom controls |
| **Personal Diary** | Undo/Redo | Font (display only) | B, I, U | — | — |
| **Drafts** | Undo/Redo | Font selector, Size | B, I, U, S | H1, H2, H3, Quote, List | — |
| **Long Drafts** | Undo/Redo | Font, Size | B, I, U, S | H1-H3, Quote, Lists | Footnote, Focus |
| **Academic** | Undo/Redo | Font, Size, Spacing | B, I, U, S | H1-H3, Lists, Table | Citation, Cross-ref |

**Toolbar dropdowns** (Font selector, Size selector, Category selector):
- Trigger: click on the dropdown button
- Dropdown panel: `--color-bg-elevated`, `--shadow-dropdown`, `--radius-md`
- Max height: 300px, scrollable
- Items: 32px height, hover with `--color-hover-overlay`
- Selected item: checkmark icon on the left

### 7.4 Canvas Area

The canvas is where writing happens. It is the most important visual surface in the app.

**General spec:**
- Background: `--color-bg-canvas` (or `--color-bg-canvas-warm` for Personal Diary)
- The canvas fills all available space between sidebar + right panel, and between toolbar + status bar
- Content within the canvas is horizontally centered and constrained to `--content-measure`
- Vertical padding: `--space-12` (48px) top, `--space-16` (64px) bottom (generous breathing room)
- Horizontal padding: `--space-8` (32px) minimum on each side of the content column

**Canvas variants:**

| Diary | Canvas Type | Special Behavior |
|-------|------------|-----------------|
| Scratchpad | Fixed page (400×600) centered in canvas area | Page shadow, stack indicator on right edge |
| Blackboard | Full-bleed infinite canvas | Dark background, no content constraint |
| Personal Diary | Scrolling document, single entry | Optional lined paper background |
| Drafts | Scrolling document, single draft | Clean white, document-title at top |
| Long Drafts | Scrolling document, single section | Section title, page break indicators |
| Academic | Scrolling document, simulated page | A4/Letter margins visible, header/footer zones |

**Content column (for text-based diaries):**

```css
.canvas-content {
  max-width: var(--content-measure);  /* 65ch */
  margin: 0 auto;
  padding: var(--space-12) var(--space-8);
  font-family: var(--content-font);   /* per-diary setting */
  font-size: var(--content-font-size-body);
  line-height: var(--leading-normal);
  color: var(--color-text-on-canvas);
}
```

**Placeholder state** (empty canvas):
- Center text: "Type / to browse options" (if slash commands are supported) or "Start writing..." 
- Font: `--font-size-base`, `--color-text-tertiary`
- Vertically positioned at ~30% from top (not dead center — that feels empty; slightly above center feels inviting)

### 7.5 Status Bar

The status bar is a persistent but unobtrusive information strip at the bottom of the writing interface.

```
┌───────────────────────────────────────────────────────────────────────┐
│  {diary-specific info}                              {word count} │ {time} │
└───────────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Height: `--space-statusbar-height` (28px)
- Background: `--color-bg-secondary`
- Top border: `1px solid --color-border-default`
- Font: `--font-size-xs`, `--color-text-tertiary`
- Horizontal padding: `--space-3` (12px)
- Items separated by a middot (·) or pipe with spacing

**Status bar content per diary:**

| Diary | Left Side | Right Side |
|-------|-----------|------------|
| Scratchpad | Page {n} of {total} · {category} | — |
| Blackboard | Zoom: {n}% | — |
| Personal Diary | {formatted date} | {words} words · {read_time} min read |
| Drafts | Status: {status} | {words} words · {read_time} min read |
| Long Drafts | Section: {name} | {section_words} / {total_words} words |
| Academic | {citation_style} · {page_size} | {words} words · {char_count} chars |

### 7.6 Right Panel

The right panel is an on-demand surface for auxiliary tools. It slides in from the right edge and shares vertical space with the canvas.

**Specs:**
- Width: `--space-panel-width` (280px)
- Background: `--color-bg-secondary`
- Left border: `1px solid --color-border-default`
- Entry animation: `translateX(280px) → translateX(0)`, `--duration-slow`, `--ease-out`
- Close button: `x` icon at top-right of panel header

**Panel header:**
- Height: 44px (aligns with toolbar)
- Title: `--font-size-md`, `--weight-semibold`
- Bottom border: `1px solid --color-border-default`
- Close button on right, back button on left (if panel has sub-views)

**Panels that use this surface:**

| Panel | Diary | Contents |
|-------|-------|----------|
| Index/Outline | Blackboard, Long Drafts | Heading tree, click to navigate |
| Bibliography | Academic | Reference list, add/edit/search |
| Reference Library | Academic | Full library, import/export |
| Export | All | Format selection, options, progress |
| Backup | Global (settings) | Backup/restore controls |
| Document Settings | Long Drafts, Academic | Per-document formatting options |

### 7.7 Command Palette

The command palette is a global quick-action interface, accessible from anywhere via `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux).

**Design (VS Code model, Linear aesthetics):**

```
┌─────────────────────────────────────────┐
│ 🔍 Type a command...                     │
├─────────────────────────────────────────┤
│  ◆ Switch to Scratchpad         ⌘1     │
│  ◆ Switch to Blackboard         ⌘2     │
│  ◆ Switch to Personal Diary     ⌘3     │
│  ◆ Switch to Drafts             ⌘4     │
│  ◆ Switch to Long Drafts        ⌘5     │
│  ◆ Switch to Academic Papers    ⌘6     │
│ ─────────────────────────────────────── │
│  ◇ New Entry                    ⌘N     │
│  ◇ Export...                    ⌘⇧E    │
│  ◇ Settings                     ⌘,     │
│  ◇ Toggle Dark Mode             ⌘⇧D    │
│  ◇ Toggle Sidebar               ⌘B     │
└─────────────────────────────────────────┘
```

**Specs:**
- Positioned: centered horizontally, 20% from top of window
- Width: 520px (max), min 400px
- Max height: 400px (scrollable)
- Background: `--color-bg-elevated`
- Border: `1px solid --color-border-default`
- Border-radius: `--radius-xl` (12px)
- Shadow: `--shadow-xl`
- Backdrop: `--color-bg-overlay`
- z-index: `--z-command-palette` (600)

**Search input:**
- Height: 48px
- Font: `--font-size-lg` (16px), `--weight-regular`
- Placeholder: "Type a command..." in `--color-text-tertiary`
- Search icon (`search`, 16px) on left
- No visible border on the input — the top of the palette IS the input
- Bottom border: `1px solid --color-border-default` separating input from results

**Result items:**
- Height: 36px
- Padding: `--space-2` `--space-3`
- Icon (16px) on left, label in `--font-size-base`, shortcut in `--font-size-xs` + `--color-text-tertiary` on right
- Hover: `--color-hover-overlay`
- Selected (keyboard): `--color-selected-bg`, `--color-text-primary`
- Group separators: 1px line with `--space-2` vertical margin

**Behavior:**
- Fuzzy search across all commands
- Results grouped: Navigation, Actions, Settings
- Context-aware: when inside a diary, diary-specific commands appear first
- Keyboard: `↑↓` to navigate, `Enter` to execute, `Esc` to close
- Closes on execution or when clicking outside
- Recent commands appear when palette opens with empty query (max 3)

**Command set (starter):**

| Command | Shortcut | Scope |
|---------|----------|-------|
| Switch to {diary} | `⌘1-6` | Global |
| Go to Shelf | `⌘H` | Global |
| New {entry/page/draft} | `⌘N` | Per-diary |
| Open Settings | `⌘,` | Global |
| Toggle Sidebar | `⌘B` | In-diary |
| Toggle Dark Mode | `⌘⇧D` | Global |
| Export Current... | `⌘⇧E` | In-diary |
| Lock Selection | `⌘L` | In-diary |
| Unlock Selection | `⌘⇧L` | In-diary |
| Find in Content | `⌘F` | In-diary |
| Focus Mode | `⌘⇧F` | Long Drafts |
| Insert Citation | `⌘⇧C` | Academic |
| Insert Footnote | `⌘⇧F` | Long Drafts, Academic |

### 7.8 Settings Modal

The settings modal is a full-featured configuration surface, opened from the shelf or via `Cmd+,`.

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                            [×]     │
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│ General  │  {Active section content}                         │
│ Appear.  │                                                   │
│ Diaries  │                                                   │
│ Shortc.  │                                                   │
│ Backup   │                                                   │
│ Privacy  │                                                   │
│ About    │                                                   │
│          │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

**Specs:**
- Size: 640px wide × 480px tall (centered in window)
- Background: `--color-bg-elevated`
- Border-radius: `--radius-xl` (12px)
- Shadow: `--shadow-modal`
- Left nav: 160px wide, `--color-bg-secondary`, right border `1px solid --color-border-default`
- Nav items: same spec as sidebar items (32px height, etc.)
- Content area: padded with `--space-inset-spacious`
- Close: `x` icon top-right + `Esc` key

### 7.9 Context Menu

The context menu (right-click) follows a standard dropdown pattern.

**Specs:**
- Background: `--color-bg-elevated`
- Border: `1px solid --color-border-default`
- Border-radius: `--radius-md` (6px)
- Shadow: `--shadow-lg`
- Min-width: 200px, max-width: 280px
- Padding: `--space-1` vertical (4px top/bottom of menu)

**Menu items:**
- Height: 32px
- Padding: `--space-1` vertical, `--space-3` horizontal
- Font: `--font-size-sm`
- Icon (16px) on left with `--space-2` gap
- Shortcut label on right in `--font-size-xs`, `--color-text-tertiary`
- Hover: `--color-accent-subtle` background, `--color-text-primary`
- Disabled: `--color-text-tertiary`, no hover effect, `cursor: default`
- Separator: 1px line with `--space-1` vertical margin
- Destructive items (delete): `--color-error` text color

### 7.10 Modal (Generic)

**Specs:**
- Background: `--color-bg-elevated`
- Border-radius: `--radius-xl` (12px)
- Shadow: `--shadow-modal`
- Backdrop: `--color-bg-overlay`
- Entry: fade in + slight scale (0.97 → 1.0), `--duration-normal`, `--ease-out`
- Exit: fade out, `--duration-fast`, `--ease-in`
- Focus trap: first focusable element receives focus on open
- Close: `Esc` key, click backdrop, explicit close button

### 7.11 Buttons

**Primary button:**
- Background: `--color-accent-default`
- Text: `--color-text-inverse`, `--weight-medium`
- Padding: `--space-inset-default` (8px 12px)
- Border-radius: `--radius-md` (6px)
- Hover: `--color-accent-hover`
- Active: darken 5% further
- Disabled: opacity 0.5, no pointer events

**Secondary button:**
- Background: transparent
- Text: `--color-text-primary`, `--weight-medium`
- Border: `1px solid --color-border-default`
- Hover: `--color-hover-overlay`
- Active: `--color-active-overlay`

**Ghost button:**
- Background: transparent
- Text: `--color-text-secondary`
- Border: none
- Hover: `--color-hover-overlay`
- Used for: toolbar buttons, sidebar actions, close buttons

**Danger button:**
- Background: `--color-error`
- Text: `--color-text-inverse`
- Used sparingly: delete confirmations only

**All buttons:**
- Font: `--font-size-base`, `--weight-medium`
- Height: 32px (default), 28px (compact/toolbar), 36px (prominent/modal actions)
- Focus: `--shadow-focus` (double-ring)
- Transition: `--transition-colors`
- No text-decoration, no text-transform

### 7.12 Form Inputs

**Text input:**
- Height: 32px
- Padding: `--space-2` horizontal
- Background: `--color-bg-primary`
- Border: `1px solid --color-border-subtle`
- Border-radius: `--radius-sm` (3px)
- Font: `--font-size-base`
- Placeholder: `--color-text-tertiary`
- Focus: border-color `--color-accent-default`, `--shadow-focus`
- Error: border-color `--color-error`

**Select:**
- Same as text input, with chevron-down icon on right
- Dropdown follows context menu styling

**Toggle/Switch:**
- Width: 36px, height: 20px
- Track: `--color-border-default` (off), `--color-accent-default` (on)
- Thumb: 16px circle, white, `--shadow-sm`
- Transition: `--duration-normal` `--ease-default`
- Focus: `--shadow-focus` on the track

### 7.13 Toast Notifications

For non-blocking feedback (backup complete, export saved, etc.).

**Specs:**
- Position: bottom-center, 24px from bottom edge
- Background: `--color-bg-elevated`
- Border: `1px solid --color-border-default`
- Border-radius: `--radius-md`
- Shadow: `--shadow-lg`
- Padding: `--space-inset-default`
- Font: `--font-size-sm`
- Icon on left (success/warning/error colored)
- Auto-dismiss: 4 seconds
- Entry: slide up + fade in, `--duration-moderate`
- Exit: fade out, `--duration-fast`

---

## 8. Diary-Specific Design Specifications

### 8.1 Scratchpad

**Identity**: Quick, disposable, color-coded. The most "analog" of all diaries.

**Sidebar content:**
- Section label: "PAGES"
- Items: "Page {n}" with a small colored dot (6px circle) showing the page's category color
- Active page: selected state
- Bottom action: "+ New Page"

**Canvas:**
- A single fixed-size page (400×600 default) is centered in the canvas area
- The page has a subtle shadow (`--shadow-sm`) to lift it off the canvas background
- Page background: the category color (e.g., `--color-cat-ideas` for Ideas)
- The page stack indicator is rendered as a thin strip on the right edge of the page:
  - Width: 6px
  - Each page represented as a 3px tall segment
  - Filled pages: `--color-text-tertiary`
  - Empty pages: `--color-border-subtle`
  - Current page: `--color-accent-default`
  - Clickable for page jumping

**Toolbar:**
- Only: Category dropdown (select color), Page navigation ([←][→][+])
- Category dropdown shows color dot + name for each option

**Interactions:**
- Click anywhere on the page to place cursor (creates TextBlock)
- Text blocks have no visible border at rest, a subtle 1px `--color-border-subtle` border on hover
- Text blocks are freely draggable (cursor changes to `grab`/`grabbing`)

### 8.2 Blackboard

**Identity**: The power tool. Spatial, dark, expansive.

**Sidebar content:**
- Section label: "INDEX"
- Heading tree with indentation levels (H1 → H2 → H3)
- Items show heading text, truncated
- Click navigates to that region on the canvas
- If no headings exist: "Add headings to build an index" in `--color-text-tertiary`

**Canvas:**
- Full-bleed dark canvas (`--color-bb-canvas`)
- No content width constraint — this is an infinite canvas
- Subtle grid: `--color-bb-canvas-grid`, 20px spacing (optional, toggleable)
- Text defaults to `--color-bb-text`
- Excalidraw handles pan, zoom, and drawing

**Toolbar:**
- Tool group: [Select, Freehand, Line, Circle, Rectangle, Arrow, Text]
- Stroke group: [Color picker, Width: Thin/Medium/Thick]
- Font selector (for text elements)
- Zoom: [−][100%][+][Fit All]

**Status bar:**
- Left: "Zoom: {n}%"
- Right: element count (optional)

### 8.3 Personal Diary

**Identity**: Warm, personal, date-driven. The most "journal-like" of all diaries.

**Sidebar content:**
- Section label: "ENTRIES"
- Items: date (formatted per user preference) + first line preview
- Grouped by month with month/year as section headers
- Optional mood dot next to date
- Bottom action: "Today" button (scrolls to or creates today's entry)

**Canvas:**
- Background: `--color-bg-canvas-warm`
- Optional: lined paper effect (horizontal lines at `--leading-relaxed` × font-size intervals, color `--color-border-on-canvas` at 40% opacity)
- Date header at top of entry: `--content-font-size-h2`, `--weight-semibold`, `--color-text-secondary`
- Content font: user-configured, default Crimson Pro
- Line-height: `--leading-relaxed` (1.75)

**Toolbar:**
- Minimal: Undo/Redo, then Bold/Italic/Underline only
- Font display (showing current font name, not selectable — Personal Diary uses fixed font)
- This intentional constraint reinforces the "one notebook, one pen" philosophy

### 8.4 Drafts

**Identity**: The workhorse. Clean, versatile, medium-length writing.

**Sidebar content:**
- Section label: "DRAFTS"
- Items: draft title + status dot (colored per status)
  - In Progress: `--color-status-in-progress`
  - Review: `--color-status-review`
  - Complete: `--color-status-complete`
- Sort options: Modified, Created, Title, Status
- Bottom action: "+ New Draft"

**Canvas:**
- Title field: `--content-font-size-title`, `--weight-bold`, placeholder "Untitled Draft"
- Body below title, separated by `--space-6` gap
- Standard TipTap editing with full formatting

**Toolbar:**
- Full formatting set: Undo/Redo | Font, Size | B, I, U, S | H1, H2, H3 | Quote, Bullet List, Ordered List | Link

### 8.5 Long Drafts

**Identity**: Structured, professional, book-length capable.

**Sidebar content:**
- Top level: document selector (dropdown or list, if user has multiple long drafts)
- Section label: "SECTIONS"
- Tree view of sections and subsections (collapsible)
- Items: section title + word count
- Drag handles on left of each item for reordering
- Status dot on right (matches Draft status system)
- Bottom action: "+ New Section"

**Canvas:**
- Section title at top: `--content-font-size-h1`, editable
- Body content below
- Page break indicators: a subtle horizontal line with "Page Break" label centered, in `--color-text-tertiary`
- Focus mode: dims sidebar and toolbar to 10% opacity, centers content with typewriter scrolling

**Toolbar:**
- Full formatting + Footnote button + Focus Mode toggle
- Focus Mode button uses `maximize-2` icon, toggles to `minimize-2` when active

**Right panel (on demand):**
- Table of Contents panel (same as sidebar tree, but in panel position for when sidebar is collapsed)
- Document settings panel (page size, margins, line spacing)

### 8.6 Academic Papers

**Identity**: Rigorous, structured, citation-heavy. The most complex diary.

**Sidebar content:**
- Top: paper selector (if multiple papers)
- Section label: "STRUCTURE"
- Sections follow academic template (Abstract, Introduction, Methods, etc.)
- Below sections: "BIBLIOGRAPHY" shortcut to open bibliography panel
- Bottom action: "+ New Section" or "+ New Paper"

**Canvas:**
- Simulated page view: visible page margins (e.g., 1-inch) shown as subtle lines or edge shading
- Header/footer zones visible but dimmed until hovered
- Content width: `--content-measure-wide` (80ch) within the page
- Double-spaced by default (`--leading-loose`)

**Toolbar:**
- Full formatting + Line Spacing selector + Citation button + Cross-reference button + Table insertion
- Citation button opens CitationPicker (either inline or as right panel)

**Right panel:**
- Bibliography Manager
- Reference Library
- Citation style selector (dropdown in panel header)
- Cross-reference picker

---

## 9. Interaction Patterns

### 9.1 Focus Management

- Opening a diary: focus moves to the canvas (editable area)
- Opening sidebar: focus stays in canvas
- Opening right panel: focus moves to panel (so keyboard users can interact)
- Opening modal: focus trapped inside modal
- Opening command palette: focus moves to search input
- Closing any overlay: focus returns to the element that triggered the open

### 9.2 Keyboard Navigation

**Global:**
| Key | Action |
|-----|--------|
| `⌘K` / `Ctrl+K` | Command palette |
| `⌘,` | Settings |
| `⌘H` | Shelf (home) |
| `⌘1-6` | Switch diary |
| `⌘B` | Toggle sidebar |
| `Tab` | Move focus forward |
| `⇧Tab` | Move focus backward |
| `Esc` | Close current overlay / exit focus mode |

**In editor:**
| Key | Action |
|-----|--------|
| `⌘N` | New entry/page/draft/section |
| `⌘S` | Save (explicit, visual confirmation) |
| `⌘Z` / `⌘⇧Z` | Undo / Redo |
| `⌘B/I/U` | Bold / Italic / Underline |
| `⌘1/2/3` | Heading 1/2/3 |
| `⌘L` | Lock selection |
| `⌘⇧L` | Unlock selection |
| `⌘F` | Find in content |
| `⌘⇧E` | Export |

### 9.3 Empty States

Every diary should handle its empty state gracefully. Empty states are an opportunity to orient the user, not just display "Nothing here."

**Pattern:**
- Centered in the canvas area
- Icon: the diary's Lucide icon at 48×48, `--color-text-tertiary`
- Headline: `--font-size-lg`, `--weight-medium`, `--color-text-secondary`
- Body: `--font-size-sm`, `--color-text-tertiary`, 1-2 lines
- Action: primary button or keyboard shortcut hint

**Examples:**

| Diary | Headline | Body | Action |
|-------|----------|------|--------|
| Scratchpad | "No pages yet" | "Quick notes, ideas, and lists" | "+ New Page" or "⌘N" |
| Blackboard | "Blank canvas" | "Think visually — sketch, connect, map" | "Click anywhere to start" |
| Personal Diary | "Start your journal" | "Today's entry is waiting" | "Write Today's Entry" |
| Drafts | "No drafts yet" | "Essays, posts, letters — start writing" | "+ New Draft" or "⌘N" |
| Long Drafts | "No documents yet" | "Books, theses, reports" | "+ New Document" |
| Academic | "No papers yet" | "Choose a template to get started" | "Create Paper" |

### 9.4 Locked Content Indication

Locked entries/pages/sections should be clearly but subtly indicated:
- In sidebar: a small `lock` icon (12px) after the item title, `--color-locked`
- In canvas: a thin top banner on the content area: `🔒 This content is locked` in `--font-size-xs`, `--color-locked`, `--color-locked-bg` background
- In canvas (locked text blocks, Scratchpad): the text block border becomes `--color-locked` (1px dashed) and content is `pointer-events: none`
- Attempting to edit locked content: brief shake animation (horizontal 2px oscillation, 200ms) + toast: "Content is locked. Use ⌘⇧L to unlock."

---

## 10. Responsive Behavior

MUWI is primarily a desktop application (Electron), but the layout should handle window resizing gracefully.

### 10.1 Window Size Breakpoints

| Width | Behavior |
|-------|----------|
| ≥ 1200px | Full layout: sidebar + canvas + right panel all fit |
| 960–1199px | Sidebar and right panel can coexist but canvas is narrower |
| 800–959px | Sidebar auto-collapses when right panel opens |
| < 800px | Sidebar overlays canvas (like a mobile drawer) |

**Minimum window size** (set in Electron config): 800×600.

### 10.2 Shelf Responsiveness

| Width | Grid Columns | Card Min-Width |
|-------|-------------|---------------|
| ≥ 960px | 4 | ~200px |
| 768–959px | 3 | ~200px |
| < 768px | 2 | ~180px |

---

## 11. Accessibility Requirements

These are not Phase 7 items — they should be implemented as each component is built or refactored.

### 11.1 Color

- All text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have 3:1 contrast against their background
- Color is never the sole indicator of state. Icons, text labels, or patterns always accompany color (e.g., status dots in sidebar also have text labels available in tooltip or screen reader)

### 11.2 Focus

- Every interactive element has a visible focus indicator (`--shadow-focus`)
- Focus order follows visual reading order (left-to-right, top-to-bottom)
- Focus is never lost — dismissing an overlay returns focus to trigger
- Skip-to-content link at top of page (hidden until focused)

### 11.3 Screen Readers

- All Lucide icons have `aria-hidden="true"` when decorative, or descriptive `aria-label` when interactive
- Sidebar navigation: `role="navigation"`, `aria-label="{Diary} Navigation"`
- Toolbar: `role="toolbar"`, buttons have `aria-label` and `aria-pressed` for toggles
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title
- Command palette: `role="combobox"` on input, `role="listbox"` on results
- Status bar: `role="status"`, `aria-live="polite"` for dynamic content
- Toast notifications: `role="alert"`

### 11.4 Motion

- All transitions respect `prefers-reduced-motion: reduce`
- No essential information is conveyed solely through animation
- Auto-dismissing toasts pause their timer on hover/focus

---

## 12. Implementation Notes

### 12.1 CSS Architecture

Tokens live in `src/styles/tokens.css` (imported globally). Component styles use Tailwind utility classes mapped to custom properties where possible, with CSS modules for complex components.

**File structure:**
```
src/styles/
├── tokens.css           ← All CSS custom properties from this doc
├── reset.css            ← CSS reset + base element styles
├── themes/
│   ├── light.css        ← Light theme token overrides (default)
│   └── dark.css         ← Dark theme token overrides
├── fonts.css            ← @fontsource imports + font-face declarations
└── utilities.css        ← Tailwind @layer extensions for MUWI-specific utilities
```

### 12.2 Theme Switching

- Theme stored in settings store (Zustand, persisted)
- Applied via `data-theme` attribute on `<html>` element
- System preference detection: `window.matchMedia('(prefers-color-scheme: dark)')`
- Three modes: Light, Dark, System (follows OS)
- Transition on theme change: `transition: background-color 200ms ease, color 100ms ease` on `html` element

### 12.3 Font Loading

- All fonts loaded via `@fontsource` packages (already bundled)
- Add `@fontsource-variable/geist-sans` and `@fontsource-variable/geist-mono`
- Font display strategy: `font-display: swap` (show fallback immediately, swap when loaded)
- Since this is Electron (local files), font loading is effectively instant

### 12.4 Tailwind Configuration Mapping

Extend Tailwind config with tokens:

```js
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          canvas: 'var(--color-bg-canvas)',
          elevated: 'var(--color-bg-elevated)',
          sunken: 'var(--color-bg-sunken)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        border: {
          default: 'var(--color-border-default)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
        },
        accent: {
          DEFAULT: 'var(--color-accent-default)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
          text: 'var(--color-accent-text)',
        },
      },
      spacing: {
        'sidebar': 'var(--space-sidebar-width)',
        'panel': 'var(--space-panel-width)',
        'toolbar': 'var(--space-toolbar-height)',
        'statusbar': 'var(--space-statusbar-height)',
        'titlebar': 'var(--space-titlebar-height)',
      },
      maxWidth: {
        'content': 'var(--space-canvas-max-width)',
        'content-wide': 'var(--space-canvas-wide-max-width)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        toolbar: 'var(--shadow-toolbar)',
        sidebar: 'var(--shadow-sidebar)',
        focus: 'var(--shadow-focus)',
      },
      fontSize: {
        'chrome-xs': 'var(--font-size-xs)',
        'chrome-sm': 'var(--font-size-sm)',
        'chrome-base': 'var(--font-size-base)',
        'chrome-md': 'var(--font-size-md)',
        'chrome-lg': 'var(--font-size-lg)',
      },
    },
  },
}
```

### 12.5 Component Refactoring Roadmap

This design system affects every component in the app. The recommended refactoring order (within Phase 7) minimizes breakage by starting with foundational styles and working outward:

1. **Tokens & Reset** — Create `tokens.css`, `reset.css`, `themes/`. Wire theme switching.
2. **Font Loading** — Install Geist, update font imports, update Tailwind config.
3. **Layout Shell** — Refactor the three-region layout (sidebar, canvas, right panel) as a shared wrapper.
4. **Shelf/Homepage** — Rebuild diary cards with new specs, remove emoji, add Lucide icons.
5. **Sidebar** — Standardize sidebar structure across all 6 diary types.
6. **Toolbar** — Rebuild toolbar with grouped icon system, per-diary configurations.
7. **Canvas** — Update canvas backgrounds, padding, content width constraints.
8. **Status Bar** — Build shared status bar component with per-diary content.
9. **Command Palette** — New component. Build, wire to command registry, expose keyboard shortcut.
10. **Modals & Overlays** — Update Modal, ContextMenu, DropDown to new tokens.
11. **Settings** — Rebuild settings modal with new layout and sections.
12. **Empty States** — Add empty state components to each diary.
13. **Accessibility Pass** — ARIA labels, focus management, screen reader testing.

### 12.6 What This Document Does NOT Change

- Data models (types, interfaces, Dexie schema)
- Store logic (Zustand actions, selectors)
- Business logic (locking, citations, footnotes, backup, export)
- Routing structure
- Test infrastructure
- Electron main process / preload

This is a visual refactor. The data flows through the same pipes — the pipes just look different.

---

*Document Version: 2.0*
*Created: February 2026*
*Authored for: MUWI Phase 7 aesthetic overhaul*
*References: Refactoring UI (Schoger/Wathan), Linear Design System, iA Writer Design Philosophy, Google Material Design 3, Tufte's Data-Ink Ratio*
