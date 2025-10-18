# Uddesa Development Roadmap

**Last Updated:** 2025-10-18  
**Current Status:** PR4 Complete + Deployment Fixed  
**Progress:** ~50% Complete (PR1-PR4 done)

---

## 📋 Table of Contents

- [Current Status](#current-status)
- [PR5: Drafts Preset](#pr5-drafts-preset)
- [PR6: Longform Preset](#pr6-longform-preset)
- [PR7: Academic Preset](#pr7-academic-preset)
- [PR8: Data & Security](#pr8-data--security)
- [PR9: Production Polish](#pr9-production-polish)
- [Timeline & Estimates](#timeline--estimates)
- [Priority Matrix](#priority-matrix)

---

## 🎯 Current Status

### ✅ Completed (PR1-PR4)

**PR1: Foundation (100%)**
- Vite + React 18 + TypeScript scaffold
- Dexie IndexedDB with memory fallback
- Diary shelf and routing system
- Settings skeleton
- Application shell

**PR2: Canvas Support (100%)**
- Excalidraw integration
- Multi-page scratchpad
- Thumbnail generation
- Page navigation rail

**PR3: Blackboard (100%)**
- Dark canvas with outline detection
- Heading extraction heuristics
- Outline panel component

**PR4: Text Editor Foundation (95%)**
- Tiptap rich text editor
- Journal preset with date nodes
- HTML/Markdown export
- Paste normalization
- Basic schema configuration

**Deployment (100%)**
- Netlify configuration complete
- React 18 compatibility fix
- Vite build optimization
- Production build working

---

## 📝 PR5: Drafts Preset

**Goal:** Create a focused writing environment with title + body structure and word count tracking.

**Status:** 0% Complete  
**Estimated Effort:** 2-3 days  
**Priority:** HIGH

### Requirements

#### 1. TitleNode Extension
**File:** [`src/editors/tiptap/extensions/TitleNode.ts`](src/editors/tiptap/extensions/TitleNode.ts)

```typescript
// Features needed:
- Custom Tiptap node for document title
- Single-line input (no line breaks)
- Larger font size styling
- Placeholder text: "Untitled"
- Always first element in document
- Can't be deleted (only cleared)
- Focus on Enter → move to body
```

**Implementation Steps:**
1. Create TitleNode extending Tiptap Node
2. Define node spec with custom rendering
3. Add keyboard shortcuts (Enter to body)
4. Style with CSS (larger font, bold)
5. Prevent deletion/line breaks
6. Add to schema configuration

**Dependencies:**
- Tiptap Node API
- Existing schema configuration

**Acceptance Criteria:**
- ✅ Title always stays at top of document
- ✅ Enter key moves cursor to body
- ✅ Title cannot contain line breaks
- ✅ Placeholder shows when empty
- ✅ Title persists in Tiptap JSON

---

#### 2. Word Count Component
**File:** `src/ui/WordCount.tsx` (new)

```typescript
// Features needed:
- Real-time word count display
- Character count (with/without spaces)
- Paragraph count
- Reading time estimate (250 words/min)
- Updates on every editor change
- Positioned in footer/status bar
```

**Implementation Steps:**
1. Create WordCount component
2. Hook into Tiptap editor state
3. Calculate metrics from editor content
4. Format display (e.g., "1,234 words")
5. Add CSS styling
6. Integrate into DraftsView

**Dependencies:**
- Tiptap useEditor hook
- Editor transaction updates

**Acceptance Criteria:**
- ✅ Updates in real-time as user types
- ✅ Shows words, characters, paragraphs
- ✅ Displays reading time estimate
- ✅ Performance: No lag on large documents
- ✅ Accessible screen reader text

---

#### 3. DraftsView Implementation
**File:** [`src/features/diaries/drafts/DraftsView.tsx`](src/features/diaries/drafts/DraftsView.tsx)

```typescript
// Layout structure:
<div className="drafts">
  <div className="drafts__editor">
    <RichText 
      extensions={[TitleNode, ...baseExtensions]}
      initialContent={page.doc}
      onChange={handleChange}
    />
  </div>
  <footer className="drafts__footer">
    <WordCount editor={editor} />
    <div className="drafts__actions">
      <button>Export HTML</button>
      <button>Export Markdown</button>
    </div>
  </footer>
</div>
```

**Implementation Steps:**
1. Create useDrafts hook for state management
2. Integrate TitleNode in schema
3. Add WordCount to footer
4. Wire up export buttons
5. Add autosave on change
6. Style layout (clean, minimal)
7. Add keyboard shortcuts

**Dependencies:**
- TitleNode extension
- WordCount component
- Existing RichText wrapper
- Export utilities

**Acceptance Criteria:**
- ✅ Title + body structure enforced
- ✅ Word count updates in real-time
- ✅ Export buttons work correctly
- ✅ Autosave every 2 seconds
- ✅ Clean, distraction-free UI
- ✅ Keyboard shortcuts documented

---

#### 4. CSS Styling
**File:** `src/index.css` (additions)

```css
/* Drafts-specific styles */
.drafts {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
}

.drafts__editor {
  flex: 1;
  overflow-y: auto;
}

.drafts__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-top: 1px solid #e5e7eb;
}

/* Title node styling */
.title-node {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.title-node:empty:before {
  content: "Untitled";
  color: #9ca3af;
}
```

---

### Testing Checklist

- [ ] Create new draft diary
- [ ] Type in title, press Enter
- [ ] Verify cursor moves to body
- [ ] Type content, check word count updates
- [ ] Export as HTML, verify title included
- [ ] Export as Markdown, verify format
- [ ] Refresh page, verify content persists
- [ ] Test with empty title
- [ ] Test with very long document (>10k words)
- [ ] Verify keyboard shortcuts work

---

## 📖 PR6: Longform Preset

**Goal:** Add structured writing features for books, essays, and reports with outline navigation and footnotes.

**Status:** 0% Complete  
**Estimated Effort:** 3-4 days  
**Priority:** MEDIUM

### Requirements

#### 1. Outline Extraction
**File:** `src/features/diaries/longform/useOutline.ts` (new)

```typescript
// Features needed:
- Extract h1, h2, h3 headings from Tiptap document
- Build hierarchical outline structure
- Update on document changes
- Track heading positions for scroll-to
- Support heading numbering (optional)
```

**Implementation Steps:**
1. Create outline extraction utility
2. Parse Tiptap JSON for heading nodes
3. Build tree structure (parent/child)
4. Calculate heading positions
5. Hook into editor transaction updates
6. Optimize for performance (debounce)

**Dependencies:**
- Tiptap editor state
- Tiptap heading extension

**Acceptance Criteria:**
- ✅ Extracts all heading levels (h1-h3)
- ✅ Updates in real-time (<100ms delay)
- ✅ Preserves hierarchy correctly
- ✅ Handles nested headings
- ✅ Performance: Works with 100+ headings

---

#### 2. Outline Navigation Panel
**File:** `src/ui/LongformOutline.tsx` (new)

```typescript
// Features needed:
- Collapsible sidebar with outline tree
- Click to scroll to heading
- Active heading highlight (based on scroll)
- Drag-to-reorder (optional v1.1)
- Heading numbering toggle
- Export outline as TOC
```

**Implementation Steps:**
1. Create LongformOutline component
2. Render tree structure recursively
3. Add click handlers for scroll-to
4. Track scroll position for active state
5. Add collapse/expand icons
6. Style with indentation for hierarchy
7. Add keyboard navigation

**Dependencies:**
- useOutline hook
- Scroll utilities

**Acceptance Criteria:**
- ✅ Shows all headings in hierarchy
- ✅ Click scrolls to heading smoothly
- ✅ Active heading highlighted
- ✅ Collapsible sections work
- ✅ Accessible keyboard navigation
- ✅ Mobile-friendly responsive design

---

#### 3. Footnote Extension
**File:** [`src/editors/tiptap/extensions/Footnote.ts`](src/editors/tiptap/extensions/Footnote.ts)

```typescript
// Features needed:
- Inline footnote marker (superscript number)
- Footnote content stored separately
- Auto-numbering (1, 2, 3...)
- Click marker to edit footnote
- Footnotes rendered at end of document
- Support for rich text in footnotes
```

**Implementation Steps:**
1. Create Footnote node extension
2. Add footnote marker rendering
3. Implement footnote storage in doc
4. Auto-number footnotes sequentially
5. Add edit dialog/popover
6. Render footnotes at document end
7. Add insert footnote command
8. Add keyboard shortcut (Ctrl+F)

**Dependencies:**
- Tiptap Node/Mark API
- Modal/Popover component

**Acceptance Criteria:**
- ✅ Footnotes auto-number correctly
- ✅ Click marker opens edit dialog
- ✅ Footnotes render at end of document
- ✅ Renumbering on insert/delete
- ✅ Rich text in footnote content
- ✅ Export includes footnotes

---

#### 4. LongformView Implementation
**File:** [`src/features/diaries/longform/LongformView.tsx`](src/features/diaries/longform/LongformView.tsx)

```typescript
// Layout structure:
<div className="longform">
  <aside className="longform__outline">
    <LongformOutline 
      headings={outline}
      activeId={activeHeading}
      onNavigate={scrollToHeading}
    />
  </aside>
  <main className="longform__editor">
    <RichText
      extensions={[...baseExtensions, Footnote]}
      initialContent={page.doc}
      onChange={handleChange}
    />
  </main>
  <footer className="longform__footnotes">
    {/* Footnotes rendered here */}
  </footer>
</div>
```

**Implementation Steps:**
1. Create useLongform hook
2. Integrate outline extraction
3. Add LongformOutline sidebar
4. Wire up scroll-to-heading
5. Integrate Footnote extension
6. Add footnote management UI
7. Style three-column layout
8. Add responsive breakpoints

**Dependencies:**
- Outline utilities
- Footnote extension
- RichText wrapper

**Acceptance Criteria:**
- ✅ Outline sidebar shows all headings
- ✅ Click outline scrolls to section
- ✅ Footnotes work correctly
- ✅ Layout responsive on mobile
- ✅ Active section highlighted
- ✅ Export includes outline + footnotes

---

### Testing Checklist

- [ ] Create longform diary
- [ ] Add multiple headings (h1, h2, h3)
- [ ] Verify outline updates in real-time
- [ ] Click outline items, verify scroll
- [ ] Add footnote, verify numbering
- [ ] Add second footnote, verify renumbering
- [ ] Edit footnote content
- [ ] Export document, verify footnotes included
- [ ] Test with 50+ headings
- [ ] Test mobile responsive layout

---

## 🎓 PR7: Academic Preset

**Goal:** Support academic writing with math equations, citations, and bibliography management.

**Status:** 0% Complete  
**Estimated Effort:** 4-5 days  
**Priority:** MEDIUM

### Requirements

#### 1. Math Rendering Integration
**File:** [`src/editors/tiptap/extensions/MathNode.ts`](src/editors/tiptap/extensions/MathNode.ts)

**Dependencies:** 
- KaTeX library: `npm install katex @types/katex`
- KaTeX CSS: Import in index.css

```typescript
// Features needed:
- Inline math: $x = 2$
- Block math: $$\int_0^1 x^2 dx$$
- LaTeX syntax support
- Live preview while typing
- Edit dialog for complex equations
- Copy LaTeX source
```

**Implementation Steps:**
1. Install KaTeX dependency
2. Create MathInline mark extension
3. Create MathBlock node extension
4. Add LaTeX parsing and rendering
5. Create math input dialog
6. Add syntax highlighting in input
7. Add common equation templates
8. Add keyboard shortcuts

**Dependencies:**
- KaTeX 0.16+
- Tiptap Mark/Node API

**Acceptance Criteria:**
- ✅ Inline math renders correctly
- ✅ Block math displays centered
- ✅ Edit dialog shows LaTeX source
- ✅ Preview updates in real-time
- ✅ Export preserves LaTeX
- ✅ Common equations templated
- ✅ Handles complex expressions

---

#### 2. Citation Management
**File:** `src/features/diaries/academic/useCitations.ts` (new)

```typescript
// Features needed:
- Store citations in diary metadata
- Support common styles (APA, MLA, Chicago)
- Inline citation markers [@smith2020]
- Hover to preview citation
- Citation library panel
- Import from BibTeX (optional v1.1)
```

**Implementation Steps:**
1. Define Citation interface
2. Create citations storage in DB
3. Create citation insertion command
4. Build citation marker rendering
5. Create citation library panel
6. Add citation formatter utility
7. Implement bibliography generation
8. Add export with citations

**Dependencies:**
- Database schema update
- Custom Tiptap node

**Acceptance Criteria:**
- ✅ Add citation to library
- ✅ Insert citation in text
- ✅ Hover shows full citation
- ✅ Bibliography auto-generates
- ✅ Multiple citation styles
- ✅ Export includes bibliography

---

#### 3. Bibliography Component
**File:** `src/features/diaries/academic/Bibliography.tsx` (new)

```typescript
// Features needed:
- Auto-generate from cited sources
- Sort alphabetically
- Format per citation style
- Show only cited references
- Click to scroll to citation
- Export as separate file
```

**Implementation Steps:**
1. Create Bibliography component
2. Extract cited references from doc
3. Sort and format entries
4. Render styled list
5. Add click-to-citation navigation
6. Add export bibliography button
7. Style per academic standards

**Dependencies:**
- useCitations hook
- Citation formatting utilities

**Acceptance Criteria:**
- ✅ Shows all cited references
- ✅ Sorted alphabetically by author
- ✅ Formatted per style guide
- ✅ Updates when citations added/removed
- ✅ Click navigates to citation
- ✅ Export as plain text/RTF

---

#### 4. AcademicView Implementation
**File:** [`src/features/diaries/academic/AcademicView.tsx`](src/features/diaries/academic/AcademicView.tsx)

```typescript
// Layout structure:
<div className="academic">
  <aside className="academic__sidebar">
    <div className="academic__section">
      <h3>Citations</h3>
      <CitationLibrary />
    </div>
    <div className="academic__section">
      <h3>Math Templates</h3>
      <MathTemplates />
    </div>
  </aside>
  <main className="academic__editor">
    <RichText
      extensions={[
        ...baseExtensions,
        MathInline,
        MathBlock,
        Citation
      ]}
      initialContent={page.doc}
      onChange={handleChange}
    />
  </main>
  <footer className="academic__bibliography">
    <Bibliography citations={citations} />
  </footer>
</div>
```

**Implementation Steps:**
1. Create useAcademic hook
2. Integrate MathNode extensions
3. Add citation management
4. Build citation library UI
5. Add math templates panel
6. Integrate Bibliography component
7. Style academic layout
8. Add export with formatting

**Dependencies:**
- MathNode extension
- Citation system
- Bibliography component

**Acceptance Criteria:**
- ✅ Math equations render correctly
- ✅ Citation insertion works
- ✅ Bibliography auto-generates
- ✅ Export includes all elements
- ✅ Professional academic styling
- ✅ Keyboard shortcuts for math/cite

---

### Testing Checklist

- [ ] Create academic diary
- [ ] Insert inline math equation
- [ ] Insert block math equation
- [ ] Verify LaTeX renders correctly
- [ ] Add citation to library
- [ ] Insert citation in text
- [ ] Verify bibliography generates
- [ ] Change citation style
- [ ] Export document with math + citations
- [ ] Test complex multi-line equations
- [ ] Test with 20+ citations

---

## 🔒 PR8: Data & Security

**Goal:** Add backup/restore, encryption, and keyboard shortcuts for power users.

**Status:** 0% Complete  
**Estimated Effort:** 3-4 days  
**Priority:** HIGH (Security)

### Requirements

#### 1. Backup System
**File:** [`src/services/backup.ts`](src/services/backup.ts)

```typescript
// Features needed:
- Export all data as JSON
- Import data from backup file
- Validate backup file structure
- Merge vs replace on import
- Schedule automatic backups (optional)
- Cloud sync (future consideration)
```

**Implementation Steps:**
1. Implement exportAll() function
2. Bundle all DB tables (diaries, pages, locks)
3. Add version number and timestamp
4. Compress with gzip (optional)
5. Implement importAll() function
6. Add schema validation
7. Add conflict resolution UI
8. Add progress indicators

**Dependencies:**
- Dexie database methods
- File System API

**Acceptance Criteria:**
- ✅ Export creates valid JSON file
- ✅ Import validates file format
- ✅ Import preserves all data
- ✅ Version compatibility checks
- ✅ User can choose merge/replace
- ✅ Progress shown for large backups

---

#### 2. Encryption System
**File:** [`src/services/crypto.ts`](src/services/crypto.ts)

**Dependencies:**
- Web Crypto API (built-in)
- PBKDF2 for key derivation

```typescript
// Features needed:
- Encrypt diary content with password
- Decrypt with correct password
- Password-based key derivation (PBKDF2)
- Salt generation per diary
- Lock/unlock UI flow
- Session timeout after inactivity
```

**Implementation Steps:**
1. Implement password hashing (PBKDF2)
2. Generate unique salt per diary
3. Implement AES-GCM encryption
4. Implement decryption with validation
5. Create Lock interface in DB
6. Build lock/unlock UI flow
7. Add session management
8. Add timeout after 15 min inactivity

**Dependencies:**
- Web Crypto API
- Database Lock table

**Acceptance Criteria:**
- ✅ Encrypt diary with password
- ✅ Cannot access without password
- ✅ Decrypt with correct password
- ✅ Wrong password shows error
- ✅ Session locks after timeout
- ✅ Password strength validation

---

#### 3. Keyboard Shortcuts
**File:** `src/services/shortcuts.ts` (new)

```typescript
// Core shortcuts needed:
- Ctrl/Cmd + N: New diary
- Ctrl/Cmd + S: Manual save
- Ctrl/Cmd + E: Export current diary
- Ctrl/Cmd + K: Show shortcuts modal
- Ctrl/Cmd + /: Focus search (future)
- Ctrl/Cmd + B: Bold text
- Ctrl/Cmd + I: Italic text
- Ctrl/Cmd + U: Underline text
- Ctrl/Cmd + L: Lock/unlock diary
```

**Implementation Steps:**
1. Create keyboard event listener
2. Define shortcut mappings
3. Handle OS differences (Ctrl vs Cmd)
4. Add context awareness (editor vs shell)
5. Create ShortcutsModal component
6. Document all shortcuts
7. Add customization (optional v1.1)
8. Add visual hints in UI

**Dependencies:**
- React event handling
- Modal component

**Acceptance Criteria:**
- ✅ All shortcuts work globally
- ✅ Mac/Windows key differences handled
- ✅ Context-aware (don't conflict)
- ✅ Modal shows all shortcuts
- ✅ Visual hints in toolbar
- ✅ Shortcuts accessible-friendly

---

#### 4. Lock/Unlock UI
**File:** `src/ui/LockDialog.tsx` (new)

```typescript
// Features needed:
- Password input with validation
- Show/hide password toggle
- Password strength meter
- Confirm password on lock
- Remember session (checkbox)
- Auto-lock after inactivity
```

**Implementation Steps:**
1. Create LockDialog component
2. Add password input with toggle
3. Add strength indicator
4. Add confirmation on first lock
5. Wire up to crypto service
6. Add session storage
7. Implement auto-lock timer
8. Style dialog professionally

**Dependencies:**
- crypto.ts service
- Modal component

**Acceptance Criteria:**
- ✅ Set password on first lock
- ✅ Strength meter shows feedback
- ✅ Unlock with correct password
- ✅ Session remembered if checked
- ✅ Auto-locks after 15 min
- ✅ Locked state persists across refresh

---

### Testing Checklist

- [ ] Export all data, verify JSON format
- [ ] Import backup, verify data restored
- [ ] Lock diary with password
- [ ] Try wrong password, verify error
- [ ] Unlock with correct password
- [ ] Verify session timeout works
- [ ] Test all keyboard shortcuts
- [ ] Open shortcuts modal
- [ ] Export locked diary (encrypted)
- [ ] Import encrypted backup

---

## ✨ PR9: Production Polish

**Goal:** Add PWA support, performance optimization, and production-ready features.

**Status:** 0% Complete  
**Estimated Effort:** 3-4 days  
**Priority:** MEDIUM

### Requirements

#### 1. PWA Configuration
**Files:** 
- `public/manifest.json` (new)
- `src/sw.ts` (new - service worker)

```json
// manifest.json
{
  "name": "Uddesa - Local-First Writing",
  "short_name": "Uddesa",
  "description": "Privacy-first writing environment",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f5f3ef",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Implementation Steps:**
1. Create PWA manifest.json
2. Generate app icons (192px, 512px)
3. Create service worker for offline
4. Cache static assets
5. Cache API responses (IndexedDB)
6. Add update notification
7. Test install flow
8. Add iOS meta tags

**Dependencies:**
- Vite PWA plugin
- Workbox (optional)

**Acceptance Criteria:**
- ✅ App installable on desktop
- ✅ App installable on mobile
- ✅ Works offline after first visit
- ✅ Update notification shows
- ✅ Icons display correctly
- ✅ Standalone mode works

---

#### 2. Performance Optimization
**Files:** Various

**Tasks:**
1. Add React.memo to expensive components
2. Implement virtual scrolling for diary list
3. Debounce autosave (2 second delay)
4. Lazy load diary views (already done)
5. Optimize thumbnail generation
6. Add loading skeletons
7. Profile with React DevTools
8. Lighthouse audit (score >90)

**Targets:**
- First Contentful Paint: <1.5s
- Time to Interactive: <3.0s
- Lighthouse Performance: >90
- Bundle size: <500KB initial

**Acceptance Criteria:**
- ✅ App loads under 2 seconds
- ✅ No layout shifts on load
- ✅ Smooth 60fps scrolling
- ✅ No memory leaks
- ✅ Works with 1000+ diaries
- ✅ Lighthouse score >90

---

#### 3. Error Boundaries
**File:** `src/ui/ErrorBoundary.tsx` (new)

```typescript
// Features needed:
- Catch React errors gracefully
- Show user-friendly error message
- Option to reload or go home
- Log errors to console (dev)
- Report to error tracking (prod, optional)
- Different boundaries per feature
```

**Implementation Steps:**
1. Create ErrorBoundary component
2. Implement error catching
3. Add error UI with retry
4. Wrap app shell
5. Wrap individual diary views
6. Add error logging
7. Test with intentional errors

**Dependencies:**
- React error boundary API

**Acceptance Criteria:**
- ✅ App doesn't crash on error
- ✅ User sees friendly message
- ✅ Can recover without refresh
- ✅ Errors logged for debugging
- ✅ Different messages per context

---

#### 4. Accessibility Audit
**Files:** Various

**Tasks:**
1. Add ARIA labels to all interactive elements
2. Ensure keyboard navigation works everywhere
3. Add skip links for screen readers
4. Test with NVDA/JAWS
5. Ensure color contrast meets WCAG AA
6. Add focus indicators
7. Test with keyboard only
8. Run axe DevTools audit

**Targets:**
- WCAG 2.1 Level AA compliance
- axe DevTools: 0 violations
- Keyboard navigable: 100%

**Acceptance Criteria:**
- ✅ All buttons have labels
- ✅ Forms have proper labels
- ✅ Focus order logical
- ✅ Color contrast >4.5:1
- ✅ Screen reader friendly
- ✅ Keyboard shortcuts don't conflict

---

#### 5. Print Styles
**File:** `src/print.css` (new)

```css
/* Print-specific styles */
@media print {
  /* Hide navigation, toolbars */
  .app-shell__header,
  .drafts__footer,
  .longform__outline {
    display: none;
  }
  
  /* Adjust typography */
  body {
    font-size: 12pt;
    line-height: 1.5;
  }
  
  /* Page breaks */
  h1, h2, h3 {
    page-break-after: avoid;
  }
  
  /* Footnotes */
  .footnote {
    page-break-inside: avoid;
  }
}
```

**Implementation Steps:**
1. Create print.css stylesheet
2. Hide UI chrome (navbars, toolbars)
3. Adjust typography for print
4. Add page break rules
5. Style footnotes for print
6. Test print preview
7. Add print button to UI

**Acceptance Criteria:**
- ✅ Clean print output
- ✅ No UI elements in print
- ✅ Proper page breaks
- ✅ Footnotes formatted correctly
- ✅ Headers/footers optional

---

#### 6. Documentation
**Files:** 
- `README.md` (update)
- `CONTRIBUTING.md` (new)
- `USER_GUIDE.md` (new)

**Tasks:**
1. Update README with features
2. Add screenshots/GIFs
3. Write CONTRIBUTING guide
4. Document development setup
5. Write USER_GUIDE for end users
6. Document keyboard shortcuts
7. Add JSDoc to public APIs
8. Create architecture diagrams

**Acceptance Criteria:**
- ✅ README up-to-date
- ✅ Contributing guide complete
- ✅ User guide covers all features
- ✅ Code documented with JSDoc
- ✅ Architecture diagrams included

---

### Testing Checklist

- [ ] Install app as PWA on desktop
- [ ] Install app as PWA on mobile
- [ ] Test offline functionality
- [ ] Run Lighthouse audit (score >90)
- [ ] Test with screen reader
- [ ] Navigate entire app with keyboard
- [ ] Print a document, verify formatting
- [ ] Intentionally cause error, verify boundary
- [ ] Test with 1000+ diaries
- [ ] Verify update notification works

---

## 📅 Timeline & Estimates

### Sprint Breakdown

**Sprint 1: PR5 - Drafts Preset (Week 1)**
- Days 1-2: TitleNode extension + WordCount
- Day 3: DraftsView implementation
- Day 4: Testing + polish

**Sprint 2: PR6 - Longform Preset (Week 2)**
- Days 1-2: Outline extraction + navigation
- Days 3-4: Footnote extension
- Day 5: LongformView + testing

**Sprint 3: PR7 - Academic Preset (Week 3)**
- Days 1-2: Math rendering (KaTeX)
- Days 3-4: Citation management
- Day 5: AcademicView + testing

**Sprint 4: PR8 - Security (Week 4)**
- Days 1-2: Backup/restore + validation
- Days 3-4: Encryption + lock UI
- Day 5: Keyboard shortcuts + testing

**Sprint 5: PR9 - Production Polish (Week 5)**
- Days 1-2: PWA + performance optimization
- Days 3-4: Error boundaries + accessibility
- Day 5: Documentation + final testing

### Total Estimated Timeline

**Focused Development:** 4-5 weeks (20-25 days)  
**Part-Time Development:** 8-10 weeks  
**With Buffer (Recommended):** 6-7 weeks

---

## 🎯 Priority Matrix

### Must Have (v1.0)

**Critical Path:**
1. ✅ PR5: Drafts Preset - Core writing functionality
2. ✅ PR8: Backup & Security - Data safety
3. ✅ PR9: PWA & Error Handling - Production stability

**Rationale:**
- Drafts = primary use case for most users
- Backup = data loss prevention (critical)
- PWA = offline support (core value prop)
- Error boundaries = production stability

### Should Have (v1.1)

**Enhanced Features:**
1. PR6: Longform Preset - Power users
2. PR7: Academic Preset - Specialized audience
3. Keyboard shortcuts - Power user features
4. Theme switching - User preference

**Rationale:**
- Longform adds significant value
- Academic targets specific audience
- Can ship without for v1.0

### Nice to Have (v1.2+)

**Future Enhancements:**
- Collaborative editing
- Cloud sync
- Mobile apps (React Native)
- Plugin system
- Custom themes
- Multi-language support
- Version history
- Templates library

---

## 🚀 Recommended Development Order

### Option A: Feature-First (Recommended)
```
PR5 (Drafts) → PR8 (Security) → PR9 (Polish) → PR6 (Longform) → PR7 (Academic)
```
**Pros:** Ship v1.0 faster, covers 80% of users  
**Cons:** Advanced users wait longer

### Option B: Complete All Features
```
PR5 → PR6 → PR7 → PR8 → PR9
```
**Pros:** Full feature parity at launch  
**Cons:** Longer time to market

### Option C: Security-First
```
PR8 (Security) → PR5 (Drafts) → PR9 (Polish) → PR6 → PR7
```
**Pros:** Data safety guaranteed early  
**Cons:** Users can't use app until PR5

**Recommendation:** Follow Option A for fastest v1.0 release, then add PR6/PR7 in v1.1

---

## 📊 Success Metrics

### v1.0 Launch Goals

**Technical:**
- ✅ All PR5, PR8, PR9 features complete
- ✅ Lighthouse score >90
- ✅ Zero critical bugs
- ✅ <2s load time
- ✅ WCAG AA compliant

**User Experience:**
- ✅ Can create and edit drafts
- ✅ Data backs up reliably
- ✅ Works offline
- ✅ Keyboard shortcuts work
- ✅ Professional, polished UI

**Documentation:**
- ✅ User guide complete
- ✅ All features documented
- ✅ Contributing guide available
- ✅ Code 80% documented

---

## 🤝 How to Contribute

1. **Pick a PR**: Choose from PR5-PR9 based on your interests
2. **Review Requirements**: Read detailed specs above
3. **Create Branch**: `git checkout -b pr5-drafts-preset`
4. **Implement Features**: Follow the implementation steps
5. **Test Thoroughly**: Complete all checklist items
6. **Submit PR**: Reference this roadmap in description

---

## 📞 Questions & Support

- **Issues**: Use GitHub Issues for bugs/features
- **Discussions**: GitHub Discussions for questions
- **Email**: [Your contact] for security issues

---

*Last updated: 2025-10-18*  
*Roadmap version: 1.0*