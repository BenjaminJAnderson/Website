# engiebenji.com Portfolio Redesign — Investigation and Implementation Plan

**Investigation date:** 2026-10-22<br />
**Status:** planning complete; implementation not started<br />
**Branch:** `redesign/astro`<br />
**Scope:** read-only audit of `/home/benji/Documents/Portfolio25-main/` and `/home/benji/Documents/Projects/Website/`.

**Implementation note:** the scaffold uses Astro 6.4.8. Astro 7 requires Node >=22.23.4 and the local runtime is 22.23.2; the content/routing APIs used here are compatible with the Astro 5 plan.

> This document records the investigation and the proposed implementation plan. It is intentionally a planning artifact, not an implementation specification that has been approved line-by-line.

---

## Key finding: two separate codebases

These are not the same project:

| Location | What it is | Current state |
|---|---|---|
| `/home/benji/Documents/Portfolio25-main/` | A Next.js terminal-portfolio reference implementation by another author | Not a Git repository, no runnable install, several stale/duplicated files |
| `/home/benji/Documents/Projects/Website/` | The live `engiebenji.com` Jekyll site | GitHub Pages legacy build from `main`, custom domain and HTTPS configured |

The live site is **Jekyll**, not Next.js. The reference is a **single-route Next.js client app**. The redesign should not assume either architecture is the right starting point.

---

# A. Reference implementation audit

## A.1 Stack and build configuration

Verified from `package.json`, config files and source:

- **Next.js 15.2.4**, React 19, TypeScript 5, Tailwind CSS 3.4.17.
- App Router with `app/layout.tsx` and `app/page.tsx`.
- shadcn/ui + Radix UI components under `components/ui/`; only `Button` and `Toggle` appear to be imported by the portfolio.
- `lucide-react` icons.
- `next/font/google` for Inter and JetBrains Mono.
- `next-themes`, forced to dark mode in `app/layout.tsx`.
- No ESLint config, no test framework, no typecheck script.
- `next.config.js` and `next.config.mjs` both exist and duplicate each other.
- `postcss.config.js` and `postcss.config.mjs` both exist.
- `next.config.js` sets `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` to `true`.
- `pnpm-lock.yaml` is 92 bytes — effectively empty, not a reproducible lockfile.
- `.gitignore` contains Rust/Tauri-style entries such as `target/`, `Dependencies.toml` and `Config.toml`. It does not ignore `node_modules` or `.next`.
- No `node_modules`, so the reference was not run or built.

The README is stale: it claims Next.js 14, React 18, Vercel deployment and MIT licensing, while the actual package is Next 15, React 19, has no deployment configuration, and the `LICENSE` file is Apache 2.0.

## A.2 Application entry points and rendering flow

### `app/layout.tsx`

- Defines site metadata for “Srikar Molahalli”.
- Loads Inter and JetBrains Mono.
- Forces `className="dark"` on `<html>` and `forcedTheme="dark"`.
- Wraps the app in `ThemeProvider`.
- Uses `generator: "v0.dev"`, which, together with the `package.json` name `my-v0-project`, suggests a generated starting point.

### `app/page.tsx`

- Entire page is a client component (`"use client"`).
- Shows `BootSequence` for 2.5 seconds, then `Terminal`.
- Uses a fixed, hotlinked background image from a Vercel Blob URL.
- Uses `h-screen` layout and `overflow-hidden`, which can be fragile on mobile browsers.
- Renders `CRTToggle` in the top-right corner.
- There is only one route. There are no project routes, about route, contact route or 404 page.

## A.3 Terminal implementation

Primary file: `components/terminal.tsx` (391 lines).

How it works:

- State: `input`, `commandHistory` (array of `{ input, output: ReactNode, timestamp }`), `historyIndex`, `currentSection`.
- A welcome message is injected in a `useEffect`.
- `handleSubmit` lowercases the command and uses a `switch` to select a section component.
- Section components are rendered **inside the terminal scrollback** as React nodes.
- `clear` empties command history.
- `ls`, `whoami`, `date`, `help` produce inline output.
- `cd <section>` is intended to navigate, but the implementation appears broken:
  - It calls `setInput(section)` and then immediately calls `handleSubmit(...)`.
  - `handleSubmit` reads `input` from the current render closure, so it still sees `cd about`, not `about`.
  - That can recurse indefinitely or process the wrong command. This is a source-level inference; it was not runtime-tested.
- The clickable navigation buttons have the same stale-state problem: they call `setInput("about")` and then `handleSubmit`, which reads the previous `input`. The buttons may only work correctly if the input already contains the target command.
- A document-level `click` listener focuses the terminal input on every click, including clicks on nav buttons, links and other controls. This is hostile to keyboard and mobile users.
- Arrow up/down implements command history.
- No tab completion, no fuzzy matching, no command palette, no route changes, no URL state, no browser back/forward integration.
- There is no `aria-live` region, no focus management and no skip link.
- The terminal input has `aria-label="Terminal input"`, but its outline is removed.
- Content is not server-rendered per section; sections only appear after a command.
- On mount, the input is focused automatically, which can open the mobile keyboard.

## A.4 Content storage and section model

All content is hardcoded in `components/sections/`:

- `about-section.tsx`
- `education-section.tsx`
- `skills-section.tsx`
- `experience-section.tsx`
- `projects-section.tsx`
- `certifications-section.tsx`
- `contact-section.tsx`

There is no data layer. To add a section you must:

1. Create a new section component.
2. Import it in `components/terminal.tsx`.
3. Add a `switch` case.
4. Add a nav button.
5. Add an ASCII header case in `components/ascii-art-component.tsx`.

`projects-section.tsx` contains five hardcoded project cards with ASCII architecture diagrams and external GitHub links. There are no screenshots, no individual project pages, no Markdown and no structured metadata. Adding a project means editing JSX.

The section components also contain personal information, phone number and email from the reference author. None of that is appropriate to reuse.

## A.5 ASCII art, boot sequence and CRT effects

### ASCII art

- `components/ascii-art-component.tsx` is the active ASCII header switch. It contains large ANSI Shadow/Standard figlet-style headers for `about`, `projects`, `skills`, etc.
- `components/ascii-art.tsx` is a near-duplicate and is not imported anywhere.
- `components/static-ascii-portrait.tsx` is the used About portrait: a 30-line `%`-character portrait at 6–8px font size.
- `components/ascii-portrait.tsx`, `components/ascii-portrait-canvas.tsx`, `components/ascii-portrait-grid.tsx`, `components/ascii-portrait-static.tsx` and `components/ascii-portrait-comparison.tsx` are unused experiments. Several load remote images from `hebbkx1anhila5yf.public.blob.vercel-storage.com` and convert them to ASCII at runtime.
- `components/image-ascii-logo.tsx` renders a fake Kali-style terminal welcome with hardcoded green `#00FF00`, breaking the monochrome system.
- `components/simple-ascii-logo.tsx` is unused.

Problems:

- Decorative ASCII is not marked `aria-hidden`, so screen readers may read box-drawing characters.
- Large ASCII headers are repeated on every section, making the interface feel like decoration rather than identity.
- Runtime image-to-ASCII conversion is unnecessary for a portfolio and adds CORS, network and performance risk.

### Boot sequence

`components/boot-sequence.tsx`:

- Five messages at 400ms intervals, then a typing animation.
- Blocks the entire interface for roughly 2.5 seconds because `app/page.tsx` gates rendering on a timer.
- No skip control.
- No `prefers-reduced-motion` handling.
- No session persistence, so it repeats on every load.

### CRT effects

`components/crt-toggle.tsx` and `app/globals.css`:

- Adds a `.crt` class to `document.body`.
- CSS pseudo-elements create scanlines and a fast flicker animation.
- Also includes `terminal-text` glow, a scanline animation and a shimmer `reflection` animation.
- The preference restore appears racy: the first effect writes `localStorage.setItem("crt-effect", "false")` on mount before the second effect reads the saved value, so a saved “on” preference may never restore. This is source-level inference.
- Flicker and scanlines are exactly the kind of effect the brief says to avoid. They hurt readability and can trigger photosensitivity concerns.

## A.6 Styling system

- `app/globals.css` is the active stylesheet. It defines monochrome HSL tokens, terminal text glow, CRT scanlines, flicker, cursor blink, typing animation and reflection.
- `styles/globals.css` is an unused light-theme duplicate.
- Tailwind config defines shadcn-style tokens. The CSS variables are mostly black/white/grey, which is a good foundation.
- Typography is Inter for sans and JetBrains Mono for mono.
- There is no spacing scale, no documented type scale and no component-level design system.
- The design relies heavily on `text-primary`, borders at `white/30` and `bg-black`, rather than a deliberate palette.
- Mobile handling is mostly Tailwind responsive classes, but `h-screen`, fixed backgrounds, a 2.5-second boot screen and a focused input are not mobile-friendly.

## A.7 Accessibility, performance and mobile support

Accessibility issues found in source:

- No skip link.
- No `aria-live` for command output.
- No semantic route structure; sections are React nodes in a scrollback.
- Auto-focus on mount and on every document click.
- Keyboard-only navigation is limited to typing commands or tabbing to small buttons.
- ASCII art is announced by screen readers.
- No visible focus styling on the terminal input.
- Small buttons (`text-xs`) and small touch targets.
- CRT flicker and scanlines.
- No reduced-motion handling anywhere.
- Boot sequence cannot be skipped.
- No headings hierarchy on the initial terminal screen.
- No error handling for unknown commands beyond plain text.
- No accessible equivalent of the command history.

Performance issues:

- The entire page is a client component.
- All section components are imported into the terminal bundle.
- Many unused UI dependencies and components are present.
- Remote background and portrait images are hotlinked.
- No route-level code splitting.
- Runtime image-to-ASCII Canvas work in some unused components.
- No image optimization strategy.
- Build ignores TypeScript and ESLint failures, so correctness is not enforced.

Mobile support:

- `h-screen` and `overflow-hidden` can cause viewport and scroll issues.
- Auto-focus can open the keyboard immediately.
- Terminal scrollback is the only way to read content.
- Nav buttons wrap but have small targets.
- Large ASCII art requires horizontal scrolling.

## A.8 Tooling, tests and licensing

- Scripts: `dev`, `build`, `start`, `lint`.
- No `typecheck`, no `test`, no CI.
- `next lint` is present but there is no ESLint configuration or dependency.
- `tsconfig.json` sets `strict: true`, but the build bypasses both type and lint errors.
- No test files of any kind.
- `LICENSE` is **Apache License 2.0** (201 lines).
- README badge says **MIT**. This inconsistency must be resolved before reusing any code.
- `README.md` is outdated and refers to Next 14/React 18/Vercel.
- Remote images and the reference author’s personal content have no clear reuse license and should not be reused.
- ASCII headers and portrait are part of the reference work; avoid copying them even if the code license permits it. The safest approach is to reimplement the interaction patterns and create original ASCII artwork.

## A.9 What to retain, improve and discard

**Retain as ideas:**

- Terminal prompt, command history and discoverable commands.
- `help`, `ls`, `whoami`, `cd`/`open` style navigation.
- Monochrome black/off-white palette.
- ASCII used for identity, not every section.
- Project architecture diagrams as content.
- A short boot/status ritual as an optional visual moment, not a gate.

**Improve:**

- Make every command navigate to a real URL.
- Make navigation clickable and keyboard accessible.
- Use a command palette with a visible button and keyboard shortcut.
- Replace the inline scrollback content with semantic pages.
- Make ASCII responsive and hidden from assistive technology when decorative.
- Remove the CRT flicker, scanline and glow effects.
- Replace remote images with owned, local assets.
- Use a content collection and Markdown project pages.
- Enforce type checking, linting and tests.

**Discard:**

- The reference’s content, personal data, portrait, background image and remote assets.
- The stale README, duplicate configs, duplicate ASCII components, unused portrait experiments and unused shadcn components.
- Blocking boot sequence.
- Document-level click focusing.
- `cd` and nav-button implementation as written.
- Build settings that ignore errors.

## A.10 The live site baseline — verified separately

The current production site is a different codebase and has different constraints:

- `_config.yml` defines a Jekyll blog with `permalink: /:year/:month/:day/:title/`, pagination and `jekyll-paginate`.
- `_layouts/`, `_includes/`, `_sass/`, `_posts/`, `_pages/`, `images/` and `cv/` make up the site.
- Posts: `_posts/2022-02-01-ORIGIN.md`, `_posts/2022-09-18-CUBE.md`, `_posts/2022-09-18-ORTHODOX.md`.
- Pages: `/about/`, `/contact/`, `/ideas/`.
- `/ideas/` is actually a duplicate contact form, despite its name; its form action differs from `/contact/`.
- `_includes/head.html` loads Roboto and Open Sans from Google Fonts, uses a white theme color, and emits a canonical URL as `engiebenji.com/` without a scheme.
- `_includes/javascripts.html` loads jQuery 3.3.1, evil-icons, fitvids and simple-jekyll-search.
- `_layouts/post.html` includes Disqus, related posts and dead Google+ sharing links.
- `_sass/0-settings/_colors.scss` defines a light theme with a blue accent, not monochrome.
- `package.json` references an old Gulp 3 / BrowserSync setup. It is not used by the GitHub Pages legacy build.
- No `.github/workflows` directory exists.
- `CNAME` is tracked and contains `engiebenji.com`.

GitHub Pages state, verified via the GitHub API on 2026-10-22:

- `build_type: legacy`
- `source.branch: main`
- `source.path: /`
- `cname: engiebenji.com`
- `https_enforced: true`
- HTTPS certificate state: `approved`, expiring 2026-11-25.

Live route checks:

- `/about/` — 200
- `/contact/` — 200
- `/ideas/` — 200
- `/2022/09/18/CUBE/` — 200
- `/2022/09/18/ORTHODOX/` — 200
- `/2022/02/01/ORIGIN/` — 200
- `/cv/BenjaminAnderson-CV.pdf` — 200

This means the current production site is small enough that migrating its content is practical, but any migration must preserve the domain, HTTPS and existing URLs.

---

# B. Architecture recommendation

## B.1 Options compared

| Option | Static GitHub Pages fit | Content model | Runtime / JS | Build and deploy | Assessment |
|---|---|---|---|---|---|
| **Keep Jekyll** | Native, unchanged legacy build | Markdown posts/pages; Liquid includes | Vanilla JS only | Ruby/Jekyll or GitHub legacy build | Lowest deployment risk, but weak component model, no typed content schema, no image pipeline, and terminal/palette/dot-matrix work must be written manually in Liquid/JS |
| **Adapt the Next.js reference** | Possible with `output: "export"` | Needs custom Markdown/MDX loading | React 19 client runtime | GitHub Actions; static `out/` | Technically viable; the reference has no server-side features. But it carries substantial cleanup debt, heavy client JS for a content site, no content collections, and no existing project routes |
| **Astro 5 static** | Excellent | Typed content collections with Markdown/MDX | Minimal, only explicit islands | GitHub Actions; static `dist/` | Best fit for a content-first portfolio with a few interactive components |
| **Plain HTML/CSS/JS** | Excellent | Manual authoring or custom scripts | Minimal | GitHub Actions | Too manual for project metadata, galleries, redirects and indexes |
| **Eleventy** | Excellent | Markdown + templates | Minimal | GitHub Actions | Viable runner-up, but less ergonomic for component-based terminal and project layouts |

## B.2 Recommendation

**Use Astro 5 in static output mode, with typed content collections, plain CSS design tokens, and small vanilla TypeScript modules for the terminal and dot-matrix footer.**

Do not port the Next.js reference wholesale. Reimplement its good interaction ideas cleanly.

Why this fits:

- The site is fundamentally static content: homepage, About, project index, project pages, contact and CV.
- Astro generates real HTML for every route, which is better for SEO, direct navigation and GitHub Pages than a single client-rendered terminal.
- Content collections give a schema for project metadata and generate project pages without hardcoding cards.
- Astro’s image pipeline can optimize project screenshots and diagrams at build time.
- Only the terminal, command palette, copy buttons and dot-matrix footer need JavaScript.
- No server, database, API, paid service or runtime image conversion is required.
- The existing content is small (three posts, three pages), so the migration cost is low.

Why not keep Jekyll:

- Jekyll is the lowest-risk deployment option because GitHub Pages builds it natively. But the brief calls for a richer interface: terminal command palette, project pages with structured metadata, responsive screenshots, a neofetch-style About view and an animated footer. Those are all possible in Jekyll, but you would spend more effort building the component and content layer yourself, with no type safety or schema validation.
- Local Jekyll preview also requires Ruby/Bundler; `bundle` is not currently installed in the environment.

Why not adapt Next.js:

- It is possible. The reference has no server-side features, and adding `output: "export"`, static params and `.nojekyll` would let it deploy to GitHub Pages.
- But the reference would need major cleanup: duplicate configs, no tests, ignored type errors, no content model, broken terminal state logic, unused dependencies and remote assets.
- A React client runtime is unnecessary weight for a mostly static portfolio.
- If React/Next reuse is specifically desired, adapting Next is a legitimate fallback. The content, routing, deployment and dot-matrix parts of this plan still apply.

Implementation choices:

- **Package manager:** npm, with a committed `package-lock.json`. `pnpm` is not installed; the reference lockfile is unusable.
- **Node:** pin Node 22 in `.nvmrc` and CI.
- **Styling:** plain CSS with custom properties and Astro scoped styles. Tailwind is not required; the reference’s Tailwind usage is not a reason to keep it.
- **Framework islands:** no React or Preact initially. Write the terminal and dot matrix in vanilla TypeScript. Add a small framework island later only if the terminal state becomes complex.
- **Routing:** Astro file-based pages with `trailingSlash: "always"` for canonical consistency.
- **No View Transitions in v1.** Standard navigation is fast, simpler and avoids extra lifecycle handling for the terminal and canvas scripts.
- **Build strictness:** `astro check`, ESLint, Prettier and unit tests in CI. Do not ignore type errors.

---

# C. Proposed website structure

```text
Website/
├─ astro.config.mjs
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ .nvmrc
├─ eslint.config.js
├─ prettier.config.cjs
├─ vitest.config.ts
├─ playwright.config.ts
├─ .gitignore
├─ README.md
├─ LICENSE
├─ THIRD_PARTY_NOTICES.md
├─ public/
│  ├─ CNAME
│  ├─ .nojekyll
│  ├─ favicon.ico
│  ├─ favicon-16x16.png
│  ├─ favicon-32x32.png
│  ├─ apple-touch-icon.png
│  ├─ android-chrome-192x192.png
│  ├─ android-chrome-512x512.png
│  ├─ site.webmanifest
│  ├─ og-default.png
│  ├─ robots.txt
│  └─ cv/
│     └─ BenjaminAnderson-CV.pdf
├─ src/
│  ├─ content.config.ts
│  ├─ content/
│  │  ├─ projects/
│  │  │  ├─ cube.md
│  │  │  ├─ orthodox.md
│  │  │  └─ engiebenji.md
│  │  └─ notes/                    # optional, only if keeping a blog
│  ├─ assets/
│  │  ├─ projects/
│  │  │  ├─ cube/
│  │  │  │  ├─ cover.webp
│  │  │  │  ├─ motherboard.webp
│  │  │  │  └─ ...
│  │  │  ├─ orthodox/
│  │  │  └─ engiebenji/
│  │  └─ identity/
│  │     └─ ascii-portrait.txt
│  ├─ components/
│  │  ├─ SiteHeader.astro
│  │  ├─ SiteFooter.astro
│  │  ├─ Nav.astro
│  │  ├─ SkipLink.astro
│  │  ├─ CommandBar.astro
│  │  ├─ CommandPalette.astro
│  │  ├─ CommandHelp.astro
│  │  ├─ TerminalPane.astro
│  │  ├─ ProjectCard.astro
│  │  ├─ ProjectList.astro
│  │  ├─ ProjectMeta.astro
│  │  ├─ ProjectGallery.astro
│  │  ├─ ProjectToc.astro
│  │  ├─ StatusBadge.astro
│  │  ├─ AsciiIdentity.astro
│  │  ├─ DotMatrixFooter.astro
│  │  ├─ Prose.astro
│  │  ├─ Callout.astro
│  │  ├─ SocialLinks.astro
│  │  ├─ CopyEmail.astro
│  │  └─ Seo.astro
│  ├─ layouts/
│  │  ├─ BaseLayout.astro
│  │  ├─ PageLayout.astro
│  │  └─ ProjectLayout.astro
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ about.astro
│  │  ├─ contact.astro
│  │  ├─ projects/
│  │  │  ├─ index.astro
│  │  │  └─ [...slug].astro
│  │  ├─ 404.astro
│  │  ├─ rss.xml.ts               # optional
│  │  └─ [...legacy].astro        # generated redirect pages
│  ├─ scripts/
│  │  ├─ commands.ts
│  │  ├─ terminal.ts
│  │  ├─ command-palette.ts
│  │  ├─ dot-matrix.ts
│  │  └─ copy-code.ts
│  ├─ styles/
│  │  ├─ tokens.css
│  │  ├─ global.css
│  │  └─ prose.css
│  └─ data/
│     ├─ site.ts
│     ├─ commands.ts
│     ├─ status.ts
│     └─ redirects.ts
├─ tests/
│  ├─ unit/
│  │  ├─ commands.test.ts
│  │  └─ dot-matrix.test.ts
│  └─ e2e/
│     └─ site.spec.ts
└─ .github/
   └─ workflows/
      ├─ ci.yml
      └─ deploy.yml
```

Important notes:

- `src/content.config.ts` is the Astro 5 content configuration. If Astro 4 is used, the equivalent is `src/content/config.ts`.
- `public/CNAME` and `public/.nojekyll` must be copied into the build output.
- `public/cv/` preserves the existing CV URL.
- Project images live in `src/assets/` so Astro can optimize them; images that must keep a fixed public URL can live in `public/`.
- `src/data/site.ts` centralizes name, role, email, social links and navigation.
- `src/data/commands.ts` centralizes command definitions so the terminal and palette share one source of truth.
- `src/data/redirects.ts` centralizes legacy URL mappings.
- `src/pages/[...legacy].astro` generates static redirect pages rather than relying on server redirects, which GitHub Pages does not support.

---

# D. User experience and visual design

## D.1 Design principles

1. **Monochrome, not murky.** Near-black surfaces, off-white text, restrained greys. Avoid pure `#000` and `#fff`.
2. **Terminal as interface, not as prison.** Terminal chrome frames navigation and commands; content remains semantic HTML with normal headings, paragraphs, images and links.
3. **ASCII as identity.** One strong identity graphic and occasional section markers. Do not put a giant figlet header on every page.
4. **Every command has a URL.** Typing `projects` navigates to `/projects/`; typing `open cube` navigates to `/projects/cube/`. Content is never trapped only in scrollback.
5. **Keyboard is an accelerator, not a requirement.** Visible links and a command palette make every destination reachable without typing.
6. **Motion only where it communicates.** No CRT flicker, scanlines, glow or infinite shimmer.
7. **Mobile is a first-class layout.** No auto-focus, no fixed-height terminal, no horizontal page scrolling.

## D.2 Visual tokens

Recommended palette:

```css
:root {
  --bg: #08090a;
  --surface: #0f1113;
  --surface-2: #15181b;
  --text: #e9e7e2;
  --text-muted: #a6a49e;
  --text-dim: #8a8a84;
  --line: #24272a;
  --line-strong: #3a3e42;
  --focus: #f5f3ee;
  --radius: 3px;
}
```

Typography:

- **JetBrains Mono** for navigation, labels, terminal, code, metadata and the wordmark.
- **Inter** for long-form prose and About copy. A monospace-only page is tiring for project write-ups.
- Self-host both via `@fontsource-variable` packages or local WOFF2 files. Do not rely on Google Fonts requests.
- Type scale: 12, 14, 16, 20, 28, 40, 56 with fluid `clamp()` for display sizes.
- Body line height around 1.6; display line height around 1.05–1.15.
- Prose max width around 72ch; page max width around 1180px.

Details:

- 1px hairline borders, 3px radius maximum.
- Off-white focus ring with 2px offset.
- Subtle dot-grid background only in the hero or footer, at very low opacity. No scanlines.
- Selection color: off-white background with near-black text.
- Status uses text plus a small shape marker, never color alone.

## D.3 Homepage

Proposed layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ BENJI / ENGIEBENJI        about  projects  contact  cv  [⌘K] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   [custom ASCII identity]    Benjamin Anderson               │
│                              Electronics engineer.           │
│                              I design hardware, firmware     │
│                              and the tools around them.      │
│                                                              │
│                              > help                          │
│                              [view projects] [about]         │
│                                                              │
│   // selected work                                           │
│   [ project card ] [ project card ] [ project card ]         │
│                                                              │
│   // now   building ... / learning ... / open to ...         │
│                                                              │
│   [ interactive dot-matrix footer ]                          │
└──────────────────────────────────────────────────────────────┘
```

Homepage rules:

- Header is always visible, with real links and a “Commands” button.
- Hero contains one ASCII identity graphic, not three competing headers.
- The terminal prompt is an invitation, not the only navigation.
- Featured projects are selected by `featured` frontmatter, not manually duplicated on the homepage.
- “Now” is a short, honest status line. Avoid fake uptime or package counts.
- No blocking boot screen. If a boot moment is kept, make it a short, skippable status line that does not hide content and is disabled under reduced motion.

## D.4 Terminal interactions

The terminal should be a **navigation and discovery layer**:

- A compact command bar in the header or hero.
- A command palette opened by `Ctrl/Cmd+K`, a visible “Commands” button, or `/`.
- Commands navigate to real pages using standard links or `location.assign`.
- `help` opens a compact help panel listing commands and clickable destinations.
- `ls` prints the list of sections with links.
- `open <project>` navigates to a project page; `open` with no argument lists projects.
- `whoami`, `date`, `contact`, `cv` produce useful, short output.
- `clear` clears the local command feedback area only.
- Unknown commands show suggestions using a simple similarity check.

Interaction details:

- Command history with up/down while the input is focused.
- Tab completion for command names and project slugs.
- `Escape` closes the palette or blurs the input.
- Do not auto-focus the input on page load.
- Do not attach a click listener that steals focus from every element.
- On mobile, the command bar collapses to a button that opens a full-screen palette. The keyboard opens only after the user taps the input.
- The palette uses a native `<dialog>` with a labelled title, focus trap, Escape handling, backdrop click and focus return.
- Command feedback uses `aria-live="polite"` or `role="status"`.
- The input has a visible label or visually hidden label and described-by instructions.
- With JavaScript disabled, all header/nav links and project pages still work; the command bar is hidden or rendered as a plain link list.

Recommended commands:

```text
help          show commands
about         open /about/
projects      open /projects/
contact       open /contact/
cv            open the CV PDF
ls            list sections
open <slug>   open a project page
whoami        short profile summary
date          current date
clear         clear command feedback
```

`cd <section>` can be supported as an alias for people who expect it, but it must not repeat the reference’s stale-state bug.

## D.5 About view — neofetch-inspired

Structure:

```text
~/about

[ original ASCII identity ]     user        Benjamin Anderson
                                role        Electronics engineer
                                host        engiebenji.com
                                location    [to be supplied]
                                education   [to be supplied]
                                stack       KiCad, C, C++, Python, ESP32, ...
                                focus       hardware design, embedded systems, ...
                                currently   [current project]
                                links       github / linkedin / email / cv
```

Requirements:

- Use a semantic `<dl>` for the system-information block: labels in dim mono, values in off-white.
- Use a short bio paragraph below the fold, not only metadata.
- Use original ASCII artwork. Options:
  - A high-contrast portrait converted offline with `chafa`/`jp2a`, then manually cleaned up and committed as static text.
  - A custom circuit-board/wordmark identity if a portrait feels too personal or does not convert well.
- Do not use the reference’s `%` portrait, its remote images, or a stock neofetch logo.
- Commit the ASCII as text; do not convert a photo at runtime.
- Mark decorative ASCII `aria-hidden="true"` and provide a text equivalent for meaningful artwork.
- On mobile, reduce or hide the large ASCII and keep the metadata readable.
- Include a “Download CV” link to `public/cv/BenjaminAnderson-CV.pdf`.
- Keep the content honest: do not invent “uptime”, “packages” or fake shell details.

## D.6 Project index

- Terminal-inspired list or card grid, depending on available imagery.
- Each project shows title, one-line summary, status, year, technology tags and a thumbnail.
- Status is textual and shape-coded, not color-only.
- Filters for `All`, `Hardware`, `Software`, `Tools` and maybe `Shipped` / `In progress`.
- Filters use `aria-pressed`, preserve a sensible no-JS fallback (all projects visible), and may update the URL query.
- No search in v1; the project count is small.
- Cards are real links with visible focus states.
- The index is generated from the content collection, sorted by `featured`, `order`, then `year`.

## D.7 Individual project pages

Each page contains:

- Breadcrumb: `~/projects/cube`
- Title and summary.
- Metadata row: year, role, status, stack, repository/demo links.
- Hero image with alt text and dimensions.
- Markdown body with H2 sections, code blocks, diagrams and images.
- Optional table of contents on desktop.
- Gallery with captions.
- “Next project” link.
- Source repository link with `rel="noopener noreferrer"`.

Content treatment:

- Use normal typography for long-form writing. The terminal motif appears in the breadcrumb and metadata, not in every paragraph.
- Code blocks use Astro’s built-in Shiki highlighting and a small copy button.
- Diagrams can be static SVG, optimized images, or ASCII in a `<pre>` with a caption and `aria-hidden`.
- Images are lazy-loaded below the fold, with width/height to prevent layout shift.
- Project photos may remain in color even though the UI is monochrome. Recommended treatment: slightly desaturated color photos framed with neutral borders. Fully grayscale imagery can obscure hardware detail. This is a design decision to confirm.

## D.8 Dot-matrix footer

- Full-width field of dots forming `ENGIEBENJI` on desktop and `BENJI` or a compact glyph on mobile.
- Base dots are dim; nearby dots brighten toward off-white as the pointer moves.
- No glow, no rainbow, no falling shapes.
- On touch, a tap creates a short pulse; scrolling is never blocked.
- Reduced-motion users get a static lit mask.
- The canvas is labelled for assistive technology; the footer still contains real text links and the domain name.
- Details are in section F.

## D.9 Coherence without forcing every page into a terminal

The terminal is a **visual motif and navigation shortcut**, not the page container.

- Header: terminal-style prompt and command button.
- Page titles: normal large typography with a small `~/path` breadcrumb.
- Metadata: mono labels, sans values.
- Body: normal prose, images, code and diagrams.
- Footer: dot-matrix identity.
- ASCII appears at the hero, About identity and footer, not as a giant header on every page.

## D.10 Responsive and motion rules

Breakpoints: 640px, 900px, 1200px.

- Stack hero columns below 900px.
- Project grid: 1 column mobile, 2 tablet, 3 desktop.
- Reduce ASCII columns or hide large artwork on small screens; provide a compact wordmark.
- Use `min-height: 100dvh`, not `h-screen`.
- Respect safe areas on iOS.
- Ensure no horizontal page scroll; scrollable `<pre>` blocks get `tabindex="0"` and a label.
- Touch targets at least 44×44px.
- Motion durations 150–220ms, ease-out.
- Disable cursor blink, typing animation, dot-matrix animation and any page transitions under `prefers-reduced-motion: reduce`.
- No CRT toggle in v1. If it is ever added, it must be off by default, subtle and reduced-motion-aware.

---

# E. Markdown content architecture

## E.1 Recommended content model

Project content lives in the portfolio repository, not fetched from individual project repositories at build time.

Proposed collection schema, `src/content.config.ts`:

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({
    base: "./src/content/projects",
    pattern: "**/*.{md,mdx}",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(180),
      status: z.enum(["shipped", "in-progress", "prototype", "archived"]),
      year: z.number().int(),
      date: z.coerce.date().optional(),
      updated: z.coerce.date().optional(),
      role: z.string().optional(),
      tech: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      gallery: z
        .array(
          z.object({
            src: image(),
            alt: z.string(),
            caption: z.string().optional(),
          })
        )
        .default([]),
      repo: z.string().url().optional(),
      demo: z.string().url().optional(),
      links: z
        .array(
          z.object({
            label: z.string(),
            href: z.string().url(),
          })
        )
        .default([]),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects };
```

Field intent:

- `title` — page and card title.
- `summary` — card and SEO description, max 180 characters.
- `status` — controlled vocabulary, displayed as text plus a shape.
- `year` — primary sorting/display year.
- `date` / `updated` — optional precise dates.
- `role` — your contribution.
- `tech` — concrete technologies, displayed as tags.
- `tags` — broader filters such as `hardware`, `pcb`, `firmware`.
- `cover` / `coverAlt` — required together by convention; add a schema refinement if desired.
- `gallery` — screenshots/diagrams with alt text and optional captions.
- `repo` / `demo` — primary links.
- `links` — additional links such as videos or write-ups.
- `featured` — homepage selection.
- `order` — manual sort override.
- `draft` — excluded from production builds.

## E.2 Example project file

`src/content/projects/cube.md`:

```md
---
title: CUBE
summary: A miniature six-PCB LED cube with custom displays, sensing and enclosure work.
status: shipped
year: 2022
role: Hardware, firmware, enclosure
tech: [KiCad, C, ESP32, FreeCAD, Blender]
tags: [hardware, pcb, led]
cover: ../../assets/projects/cube/cover.webp
coverAlt: Six illuminated PCB faces of the CUBE prototype.
gallery:
  - src: ../../assets/projects/cube/motherboard.webp
    alt: CUBE motherboard with the ESP32 and display connectors.
    caption: Motherboard and daughter-board interconnect.
  - src: ../../assets/projects/cube/inside-cube.webp
    alt: Inside view of the assembled cube showing the PCB stack.
repo: https://github.com/BenjaminJAnderson/...
featured: true
order: 1
---

## Overview

...

## Constraints

...

## Design

...

## Results

...

## What I learned

...
```

Conventions:

- Do not repeat the title as an H1 in the body; the layout renders it.
- Use H2 for major sections, H3 for subsections.
- Use fenced code blocks with language identifiers.
- Use captions for meaningful images.
- Keep diagrams as SVG where possible; use ASCII only when it communicates structure better.
- Keep `summary` short; put the long description in the body.

## E.3 Image organisation

Recommended:

```text
src/assets/projects/<slug>/
├─ cover.webp
├─ 01-overview.webp
├─ 02-detail.webp
└─ diagram.svg
```

- Use WebP or AVIF for photos, SVG for diagrams.
- Provide alt text for every meaningful image.
- Use Astro’s `<Image>` component in layouts and MDX components.
- For plain Markdown body images, use relative paths and verify that Astro optimizes them; if not, use an MDX `ProjectImage` component or pre-optimized public assets.
- Do not hotlink images from other domains.

## E.4 Page generation

- `src/pages/projects/index.astro` calls `getCollection("projects")`, filters drafts in production, sorts and renders `ProjectList`.
- `src/pages/projects/[...slug].astro` uses `getStaticPaths` with `project.id` as the slug, then renders `ProjectLayout` and `<Content />`.
- `src/pages/index.astro` filters `featured` projects for the homepage.
- `src/pages/[...legacy].astro` generates redirect HTML for old Jekyll URLs from `src/data/redirects.ts`.
- `src/pages/404.astro` generates `dist/404.html`.
- Sitemap is generated with `@astrojs/sitemap`.
- RSS is optional and only worth adding if a notes/blog section is retained.

## E.5 Adding a new project in practice

1. Create `src/content/projects/my-project.md`.
2. Fill in the frontmatter.
3. Add `cover.webp` and any gallery images under `src/assets/projects/my-project/`.
4. Write the body with H2 sections, images, diagrams and code.
5. Set `featured: true` if it should appear on the homepage.
6. Run `npm run dev`; the page is available at `/projects/my-project/`.
7. Run `npm run build`; the index, sitemap and homepage update automatically.
8. Commit the Markdown file and assets.

No homepage edit, no component edit and no terminal switch-case edit is required.

## E.6 In-repo content vs importing from project repositories

| Approach | Advantages | Costs | Recommendation |
|---|---|---|---|
| **In-repo Markdown/MDX** | Typed schema, deterministic builds, build-time image optimization, no network/auth, easy editing | Some duplication with project READMEs | **Recommended** |
| Git submodules | Content stays in project repos | Coupling, auth for private repos, inconsistent formatting, harder CI | No |
| Fetch READMEs via GitHub API at build | Single source for text | Rate limits, network failures, auth, sanitization, broken images, non-deterministic builds | No |
| Manual copy/sync script | Keeps portfolio presentation controlled | Requires discipline | Optional later |

Recommendation: write the portfolio case study in the portfolio repo, link to the source repository, and optionally keep a small manual sync checklist. Do not make the build depend on external repositories.

## E.7 Migration of existing content

Current content to migrate:

- `_posts/2022-09-18-CUBE.md` → `src/content/projects/cube.md`
- `_posts/2022-09-18-ORTHODOX.md` → `src/content/projects/orthodox.md`
- `_posts/2022-02-01-ORIGIN.md` → either `src/content/projects/engiebenji.md` or `src/content/notes/origin.md`
- `_pages/about/about.md` → `src/pages/about.astro` content, expanded into the neofetch layout
- `_pages/contact/contact.html` → `src/pages/contact.astro`
- `_pages/ideas/ideas.html` → redirect to `/contact/` or remove
- `images/*.webp` → relocate to `src/assets/projects/<slug>/` where appropriate
- `cv/BenjaminAnderson-CV.pdf` → `public/cv/`

Preserve:

- `/about/`
- `/contact/`
- `/cv/BenjaminAnderson-CV.pdf`

Redirect:

- `/2022/02/01/ORIGIN/`
- `/2022/09/18/CUBE/`
- `/2022/09/18/ORTHODOX/`
- `/ideas/`
- `/tags.html`
- `/search.json`
- `/feed.xml` if no equivalent remains

Do not carry over Disqus comments, dead Google+ sharing links, Google Analytics (currently blank) or the old search dependency.

---

# F. Dot-matrix implementation plan

## F.1 Rendering technique comparison

| Technique | Fit | Performance | Maintainability | Verdict |
|---|---|---|---|---|
| DOM elements/spans per dot | Easy to style | Poor at 1,000+ dots | Simple but noisy | No |
| SVG circles | Crisp, accessible, easy fallback | Fine for a few hundred dots; heavy for thousands with per-dot updates | Good for static; harder for animation | Use for static fallback only |
| **Canvas 2D** | Full control over dot brightness/radius | Good with a capped grid and one rAF loop | Moderate; isolate in one module | **Recommended** |
| WebGL | Maximum performance | Overkill | High complexity | No |
| CSS-only | No per-dot distance lighting | Good for static | Limited effect | No |

## F.2 Recommended approach

Use a single **Canvas 2D** element with:

- A precomputed dot grid sampled from an offscreen mask.
- A pointer-following pool of light.
- Time-based falloff and decay.
- A static render path for reduced motion and no-JS fallback.

Do not sample a bitmap from a remote image at runtime. Build the mask from an SVG path or an offscreen-rendered wordmark so the result is deterministic and local.

## F.3 Algorithm

1. **Build the mask**
   - Render the wordmark/graphic to an offscreen canvas at grid resolution.
   - Read the alpha channel.
   - Create a dot at each grid cell whose alpha exceeds a threshold.
   - Optionally record base alpha for softer edges.

2. **Create the grid**
   - Spacing: `clamp(8, containerWidth / 90, 14)`.
   - Radius: `spacing * 0.18`.
   - Cap total dots at roughly 3,000–3,500; increase spacing if exceeded.
   - Center the mask in the canvas.

3. **Static render**
   - Clear the canvas.
   - Draw all dots at base alpha.
   - This is also the reduced-motion and fallback state.

4. **Pointer state**
   - Store pointer position in CSS pixels relative to the canvas.
   - Smooth the pointer with a lerp, e.g. `pointer += (target - pointer) * 0.18`.
   - On leave/cancel, decay influence to zero.

5. **Per-frame influence**
   - For each dot, compute squared distance to the smoothed pointer.
   - `influence = exp(-distanceSquared / (2 * sigmaSquared))`.
   - `sigma` around 70–100px, scaled to spacing.
   - Alpha = base + (1 - base) * influence.
   - Radius = baseRadius * (1 + 0.35 * influence).
   - Draw only dots with changed alpha, or redraw the full grid; a few thousand circles is manageable.

6. **Idle behaviour**
   - Stop the rAF loop when the pointer is inactive and all influence has decayed.
   - Restart on pointer movement.
   - Pause when the footer is offscreen via `IntersectionObserver`.
   - Pause on `visibilitychange`.

7. **Resize**
   - Use `ResizeObserver` with a short debounce.
   - Recompute canvas size, DPR scale and grid.
   - Preserve the current pointer position if still valid.

## F.4 Pointer and touch handling

- Use `pointermove`, `pointerdown`, `pointerleave` and `pointercancel` on the canvas.
- Mouse: continuous pool of light.
- Touch: a tap or press creates a short-lived pulse; do not hijack scrolling. Use `touch-action: pan-y` and never call `preventDefault()` on vertical gestures.
- Do not use hover as the only interaction.
- Keyboard users are unaffected; the canvas is decorative and not a control.
- Clean up listeners when the component unmounts or the page is swapped.

## F.5 Performance safeguards

- Cap device pixel ratio at 2.
- Cap dot count.
- Use one rAF loop, not one per dot.
- Avoid `shadowBlur`, canvas filters and per-frame gradient creation.
- Avoid allocations inside the draw loop; reuse arrays and objects.
- Use passive pointer listeners.
- Stop when offscreen or tab-hidden.
- Test with CPU throttling and a mid-range mobile viewport.
- Target 60fps on desktop and a stable, lower-dot version on mobile.

## F.6 Accessibility

- Canvas gets `role="img"` and an `aria-label` such as “engiebenji.com dot-matrix wordmark”.
- Provide visually hidden text nearby: “engiebenji.com”.
- Footer links remain real links; the canvas is never the only navigation.
- Under `prefers-reduced-motion: reduce`, render the static mask and do not start the animation loop.
- Provide a `<noscript>` static SVG wordmark or plain text fallback.
- Do not convey status or meaning only through the animation.

## F.7 What the op.al implementation does, and what to change

The deployed op.al HTML and JavaScript chunk were inspected, not their source repository. The verified behaviour:

- A `<canvas>` with an aspect ratio around 2.1:1.
- Samples an SVG logo mask into a dot grid.
- Uses character glyphs such as `·`, `◦`, `•`, `●` as dots.
- Tracks mouse position, smooths the pointer and lights nearby dots.
- Uses `requestAnimationFrame`, `ResizeObserver` and `IntersectionObserver`.
- Adds random falling shapes.
- Appears to listen only to mouse events; no touch or reduced-motion handling was observed in the inspected bundle.

Recommended adaptation:

- Keep the mask-sampling + pointer-influence idea.
- Use circles, not character glyphs, for a cleaner monochrome look.
- Remove falling shapes.
- Add touch pulse handling.
- Add reduced-motion static mode.
- Cap dots and DPR.
- Write original code and assets; do not copy op.al’s implementation or branding.

---

# G. Deployment and testing strategy

## G.1 Static hosting compatibility

Astro’s default `output: "static"` produces a `dist/` directory of HTML, CSS, JS and assets. There are no server-side features:

- No API routes.
- No server actions.
- No database.
- No runtime image service.
- No authentication.
- Contact is handled by `mailto:` or an optional external form service.

This is compatible with GitHub Pages.

## G.2 Astro configuration

```js
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://engiebenji.com",
  base: "/",
  trailingSlash: "always",
  output: "static",
  integrations: [sitemap()],
});
```

Route behaviour:

- `/projects/cube/` → `dist/projects/cube/index.html`.
- GitHub Pages serves directory index files.
- `dist/404.html` handles unknown paths.
- Direct navigation to a project URL works because every page is a real HTML file.

## G.3 Custom domain, CNAME and HTTPS

Preserve:

- `public/CNAME` containing `engiebenji.com`.
- The custom domain setting in GitHub Pages.
- `https_enforced: true`.

Add:

- `public/.nojekyll` so GitHub Pages does not attempt Jekyll processing on the deployed artifact.

Current verified state:

- Pages build type: legacy.
- Source: `main`, path `/`.
- Custom domain: `engiebenji.com`.
- HTTPS enforced and certificate approved.

No DNS changes are planned. Keep the existing apex/www records. After switching Pages source, re-check the certificate and `https://engiebenji.com`.

## G.4 GitHub Actions

### CI workflow, `.github/workflows/ci.yml`

Runs on pull requests and manual dispatch. Builds and validates only; never deploys.

```yaml
name: CI
on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: site-dist
          path: dist
```

### Deploy workflow, `.github/workflows/deploy.yml`

Runs only on `main` or manual dispatch. Uses the official Pages actions.

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
        with:
          node-version: 22

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Notes:

- Pin action majors and review them at implementation time.
- `withastro/action` handles install, build and Pages artifact upload for npm projects with a committed lockfile.
- No secrets are required.
- The `github-pages` environment should require a reviewer for production deploys.
- Do not add `pull_request_target` or deploy-from-any-branch triggers.

## G.5 Safe cutover sequence

The current production site must remain untouched until the new site is ready.

1. Work in a separate clone, e.g. `Website-redesign`, with branch `redesign/astro`. Do not modify the original `/home/benji/Documents/Projects/Website` working tree or its Git state.
2. Develop and validate locally.
3. Push only the feature branch; open a draft pull request.
4. CI builds the site and uploads `dist` as an artifact. No deployment occurs.
5. Review the built HTML locally and optionally on a temporary staging deployment if desired.
6. Before cutover, create a tag or branch of the current `main` with the Jekyll site for rollback.
7. In GitHub Pages settings, switch the source from “Deploy from a branch” to “GitHub Actions”. The previously deployed site remains live until a new deployment succeeds.
8. Merge the approved pull request to `main`.
9. The deploy workflow runs; approve the `github-pages` environment if protection is configured.
10. Verify the custom domain, HTTPS, all routes, the 404 page, CV download, project pages and mobile layout.
11. If anything fails, revert the merge or switch Pages back to the legacy source branch. The last successful deployment remains available.

This sequence avoids a broken legacy build while Astro files replace the Jekyll root.

## G.6 Local preview

In the separate clone:

```bash
npm ci
npm run dev
```

Open `http://localhost:4321`.

For a production-like check:

```bash
npm run build
npm run preview
```

For static-host emulation:

```bash
npx serve dist
```

Test direct navigation to:

- `/`
- `/about/`
- `/contact/`
- `/projects/`
- `/projects/cube/`
- `/cv/BenjaminAnderson-CV.pdf`
- `/404.html`

## G.7 Validation commands

Suggested `package.json` scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

Validation checklist:

- `npm ci` succeeds from the lockfile.
- `npm run check` passes with strict TypeScript.
- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` succeeds.
- `dist/CNAME` contains exactly `engiebenji.com`.
- `dist/.nojekyll` exists.
- `dist/404.html` exists.
- `dist/projects/<slug>/index.html` exists for every project.
- `dist/sitemap-index.xml` or equivalent exists.
- No `localhost`, `undefined` or remote hotlinks in built HTML.
- All internal links resolve.
- All external links are intentional.
- No console errors.
- Keyboard-only navigation works.
- No-JS navigation works for static content.
- `prefers-reduced-motion` disables the boot/terminal/typing/dot-matrix animations.
- Mobile viewport has no horizontal page scroll.
- Touch targets are large enough.
- Lighthouse accessibility and performance are reviewed.
- Axe or Playwright accessibility checks report no critical issues.

## G.8 Safeguards against accidental production deployment

- Deploy only from `main`.
- Require pull requests and passing checks on `main`.
- Protect the `github-pages` environment with a required reviewer.
- Do not create deploy triggers for feature branches.
- Do not use `workflow_run` or `pull_request_target` for deployment.
- Do not commit `.env` files or secrets.
- Keep the original Jekyll site available on a tagged branch until the new deployment is verified.
- Keep `CNAME`, custom domain and HTTPS settings unchanged during development.
- Do not switch the Pages source until explicit approval.

---

# H. Phased implementation roadmap

| Milestone | Scope and outcome | Relevant files/components | Depends on | Verification and acceptance |
|---|---|---|---|---|
| **M0 — Decisions and content inventory** | Confirm architecture, routes, project list, bio, contact method, ASCII identity, dot-matrix wordmark, licensing and cutover plan. Collect copy, images, CV and repository links. Map old URLs to new URLs. | No code. A content checklist in the issue/README. `src/data/redirects.ts` plan. | None | All decisions approved. Project list and assets available. Redirect map agreed. No implementation starts without this. |
| **M1 — Static foundation** | Create the Astro project in a separate clone. Add design tokens, fonts, base layout, header, nav, footer, static homepage, About placeholder, contact page, 404 and CI build. No terminal or canvas yet. | `astro.config.mjs`, `package.json`, `src/styles/*`, `src/layouts/BaseLayout.astro`, `SiteHeader.astro`, `SiteFooter.astro`, `src/pages/index.astro`, `about.astro`, `contact.astro`, `404.astro`, `.github/workflows/ci.yml` | M0 | `npm ci`, `npm run check`, `npm run build`, `npm run preview` succeed. All static routes render. Responsive and keyboard basics pass. `dist/CNAME` and `dist/.nojekyll` exist. CI is green. No deploy. |
| **M2 — Content model and project pages** | Add the content collection, schema, project index, individual project pages, image handling, migration of CUBE/ORTHODOX/ORIGIN, redirects, sitemap and metadata. Remove hardcoded project duplication. | `src/content.config.ts`, `src/content/projects/*`, `src/assets/projects/*`, `src/pages/projects/index.astro`, `src/pages/projects/[...slug].astro`, `ProjectCard.astro`, `ProjectLayout.astro`, `ProjectMeta.astro`, `ProjectGallery.astro`, `src/pages/[...legacy].astro`, `Seo.astro` | M1 | All project URLs return 200. Schema validation passes. Images render with width/height and alt text. Old URLs redirect. Adding a test project requires only a Markdown file and assets. Index and homepage update automatically. |
| **M3 — Terminal command bar and palette** | Implement the command parser, command bar, command palette, history, tab completion, aliases, visible clickable navigation and accessible feedback. Commands navigate to real routes. No blocking boot. | `src/components/CommandBar.astro`, `CommandPalette.astro`, `TerminalPane.astro`, `src/scripts/commands.ts`, `terminal.ts`, `command-palette.ts`, `src/data/commands.ts`, unit tests | M1, M2 | Commands `help`, `about`, `projects`, `open cube`, `contact`, `cv`, `ls`, `whoami`, `date`, `clear` work. Palette opens via button and `Ctrl/Cmd+K`. Focus trap and Escape work. No auto-focus on load. No-JS nav still works. Keyboard-only and mobile tests pass. Unit tests pass. |
| **M4 — About neofetch view and ASCII identity** | Add the original ASCII identity graphic, semantic metadata list, bio, toolbox, current work, social links and CV. Make it responsive and accessible. | `src/pages/about.astro`, `AsciiIdentity.astro`, `src/assets/identity/ascii-portrait.txt`, `SocialLinks.astro`, `CopyEmail.astro`, `src/data/site.ts` | M1 | Copy approved. ASCII is `aria-hidden` or has a text equivalent. Metadata uses `<dl>`. Layout stacks cleanly on mobile. No layout shift. CV link works. |
| **M5 — Dot-matrix footer** | Implement the canvas footer with mask sampling, pointer influence, touch pulse, reduced-motion static mode, performance caps and fallback. Keep the rest of the site stable. | `DotMatrixFooter.astro`, `src/scripts/dot-matrix.ts`, unit tests for grid/falloff math, static SVG fallback | M1–M4 | Effect works on desktop. Touch tap produces a pulse without blocking scroll. Reduced motion renders static. Canvas has an accessible label and visible text alternative. No jank at 4× CPU throttle. No console errors. Dot count and DPR caps hold. |
| **M6 — Polish and hardening** | Add final motion, Open Graph/metadata, sitemap, optional RSS, 404, redirect verification, link checking, accessibility audit, performance audit, cross-browser testing and copy proofreading. | `src/components/Seo.astro`, `public/og-default.png`, `public/robots.txt`, `src/pages/rss.xml.ts` if needed, tests, `README.md` | M1–M5 | Lighthouse performance and accessibility reviewed. Axe has no critical issues. All internal links resolve. All legacy URLs redirect. 404 works. Mobile, keyboard, no-JS and reduced-motion checks pass. No console errors. |
| **M7 — Production cutover** | Merge the approved PR, switch Pages source to GitHub Actions, deploy, verify the custom domain and HTTPS, and document rollback. | `.github/workflows/deploy.yml`, GitHub Pages settings, `public/CNAME`, `public/.nojekyll`, rollback tag/branch | M6 plus explicit approval | CI green. Deploy workflow succeeds. `https://engiebenji.com` serves the new site. `/about/`, `/projects/`, `/projects/cube/`, `/cv/...` and 404 behave correctly. HTTPS enforced. Mobile check passes. Rollback path documented and tested. |

Recommended order: **M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7.** Do not start M5 before the static site and content model are stable. Do not start M7 without an explicit deployment approval.

---

# I. Risks and unresolved decisions

## I.1 Verified facts, assumptions and unknowns

**Verified:**

- The reference is Next.js 15.2.4 / React 19, not Next 14 / React 18 as its README claims.
- The reference has no tests, no ESLint config, no typecheck script, and its build ignores TypeScript and ESLint errors.
- The reference has duplicate Next/PostCSS configs, duplicate ASCII components, an unused light-theme stylesheet, many unused UI components and an empty pnpm lockfile.
- The reference’s terminal `cd` and nav-button paths appear broken by stale React state closure. This is inferred from source, not runtime-tested.
- The reference’s CRT preference restore appears racy due to effect order. Inferred, not runtime-tested.
- The reference’s remote images are hotlinked from a Vercel Blob domain.
- The reference’s README says MIT but its `LICENSE` is Apache 2.0.
- The live `engiebenji.com` is a Jekyll site using GitHub Pages legacy build from `main`.
- The live custom domain is `engiebenji.com`, HTTPS is enforced, and the certificate is approved.
- Live routes for `/about/`, `/contact/`, `/ideas/`, the three old post URLs and the CV return 200.
- The live canonical URL is missing its scheme and therefore malformed.
- The op.al footer uses a canvas, mask sampling, pointer smoothing, rAF, ResizeObserver and IntersectionObserver; mouse-only and no reduced-motion handling were observed in the deployed bundle.
- No browser automation was available. The reference was not run. The op.al site was not visually tested; only its deployed HTML/JS was inspected.

**Assumptions:**

- The current site’s images, CV and project content are owned by the site owner or used with permission.
- There is admin access to the GitHub repository settings and DNS.
- The project count will stay small enough that client-side search is unnecessary.
- The site should remain dark-only; a light theme is not required.
- The current GitHub Pages DNS records should not change.
- Astro and action versions will be pinned at implementation time; exact versions may differ from this report.
- The custom domain certificate will remain valid or renew automatically after the Pages source switch.

**Unknowns:**

- Exact final project list, project descriptions, dates, roles, repository links and screenshots.
- Whether to keep a blog/notes section beyond the three existing posts.
- Whether a portrait-based ASCII identity or a wordmark/circuit identity is preferred.
- Whether project photos should remain in color or be treated in grayscale.
- Whether to keep a contact form (Formspree) or switch to `mailto:`.
- Whether to preserve `/ideas/` as a page or redirect it.
- Whether comments, analytics or search are wanted in the future.
- Whether the GitHub Pages source switch will require any DNS or certificate re-verification beyond what is already configured.

## I.2 Risk register

| Risk | Impact | Mitigation | Basis |
|---|---|---|---|
| Pages source cutover breaks production | High | Switch only after approval; last successful deployment remains live; keep a Jekyll rollback branch/tag; verify custom domain and HTTPS after deploy | Verified current Pages config |
| Legacy Jekyll build conflicts with Astro files | High | Develop in a separate clone; switch Pages source before merging the Astro root; do not rely on legacy build after cutover | Verified legacy build |
| Old URLs lose search traffic or inbound links | Medium | Generate static redirect pages for all old post/page URLs; keep `/about/`, `/contact/`, `/cv/` stable | Verified live routes |
| Reference code is copied without valid licensing | Medium | Clean-room reimplementation; do not reuse personal content or remote images; add third-party notices only for code actually reused | Apache/MIT mismatch |
| Terminal is undiscoverable or inaccessible | High | Visible nav, command palette button, `help`, clickable suggestions, no auto-focus, `aria-live`, keyboard tests | Source audit |
| Dot matrix causes jank or motion sickness | Medium | Cap dots/DPR, pause offscreen, single rAF, reduced-motion static mode, touch-safe behavior | Design requirement |
| ASCII art breaks mobile or screen readers | Medium | Responsive variants, overflow handling, `aria-hidden` or text alternatives | Source audit |
| Content model blocks on missing assets/copy | Medium | M0 content checklist; use placeholders only in local development; do not ship invented facts | Planning assumption |
| Contact form introduces third-party dependency | Low | Use `mailto:` + copy button; keep Formspree optional | Requirement to avoid unnecessary services |
| Dependency drift or non-reproducible builds | Medium | Commit `package-lock.json`, pin Node 22, pin action majors, run `npm ci` in CI | Reference lockfile issue |
| Overbuilding the terminal | Medium | Navigation-first design; real routes; keep the terminal as a shortcut; no fake shell features | UX requirement |
| GitHub Actions permissions misconfigured | High | Minimal `permissions`, environment protection, branch protection, no branch deploy triggers | Deployment requirement |
| SEO regression from single-page reference approach | Medium | Astro static HTML per route, canonical URLs with scheme, sitemap, metadata, redirects | Reference is single-route |
| Fonts cause layout shift or external requests | Low | Self-host fonts, preload one mono weight, use fallback metrics, `font-display: swap` | Performance requirement |
| Visual design drifts into “retro gimmick” | Medium | No CRT, no scanlines, no glow, restrained ASCII, monochrome tokens, review at M1/M4/M6 | Brief |

## I.3 Decisions to approve before development

| # | Decision | Recommended choice | Why it matters |
|---|---|---|---|
| 1 | **Framework** | Astro 5 static | Best fit for static content, project collections, minimal JS and GitHub Pages |
| 2 | **Hosting cutover** | GitHub Actions + Pages; keep `engiebenji.com`, CNAME and HTTPS | Required for Astro; current legacy Jekyll build cannot serve the new site |
| 3 | **Migration scope** | Convert CUBE, ORTHODOX and ORIGIN into project pages or notes; preserve `/about/`, `/contact/`, `/cv/`; redirect old post URLs and `/ideas/` | Avoid broken links and preserve existing content |
| 4 | **Terminal model** | Navigation-first command bar + palette; commands go to real URLs; no blocking boot | Keeps the strongest reference idea without trapping content in a scrollback |
| 5 | **Visual direction** | Dark-only monochrome; no CRT, scanlines or glow; ASCII only for identity and occasional markers | Matches the brief and avoids readability problems |
| 6 | **Project photos** | UI monochrome; photos slightly desaturated but still in color | Preserves hardware detail while keeping the page cohesive. Confirm if full grayscale is preferred |
| 7 | **About identity** | Original ASCII portrait if a suitable high-contrast photo is provided; otherwise a custom wordmark/circuit identity | Must be distinct and legally reusable |
| 8 | **Dot-matrix wordmark** | `ENGIEBENJI` on desktop, `BENJI` or compact glyph on mobile; circles; touch pulse; reduced-motion static | Defines the footer effect and responsive behavior |
| 9 | **Contact** | `mailto:` + copy email; no Formspree dependency | Avoids an external service and spam surface |
| 10 | **Blog/notes** | Keep ORIGIN as a note or project case study; do not add a full blog unless more writing is planned | Controls scope and maintenance |
| 11 | **Comments/analytics/search** | None in v1; add Pagefind later only if notes grow | Keeps the build simple and private |
| 12 | **Licensing** | MIT for original code; personal content and images © Benjamin Anderson; include third-party notices | Clarifies reuse and avoids the reference’s license inconsistency |
| 13 | **Deployment approval** | Approve the Pages source switch and cutover window after M6 | Prevents accidental production changes |

---

# Recommended implementation order and approval gates

1. **M0 — Approve decisions and gather content.** No code.
2. **M1 — Astro foundation and CI build.** No deployment.
3. **M2 — Content model, project pages and migration.** Review the content architecture before adding interaction.
4. **M3 — Terminal command bar and palette.** Build on real routes, not inline page rendering.
5. **M4 — About neofetch view and original ASCII identity.**
6. **M5 — Dot-matrix footer.** Only after the static foundation is stable.
7. **M6 — Accessibility, performance, SEO and cross-browser hardening.**
8. **M7 — Production cutover.** Requires explicit approval, a rollback branch/tag and a monitored deployment.

**Approval gates:** approve decisions 1–13 before M1; approve the visual direction after M1; approve the content model after M2; approve the terminal behavior after M3; approve the deployment cutover only after M6.
