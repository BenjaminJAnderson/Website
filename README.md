# engiebenji.com

Personal engineering portfolio for Benjamin Anderson, presented as a full-screen terminal and built with Astro for static hosting. It documents hardware, firmware and software projects, alongside an in-browser CV, an interactive command prompt and ASCII identity effects.

## Overview

engiebenji.com is the personal portfolio of Benjamin Anderson, an electronics engineer working across hardware, firmware and product design. The site replaces an earlier Jekyll build with an Astro project that renders every route to static HTML for GitHub Pages.

The terminal is both the visual identity and a navigation layer. Every command maps to a real URL, so the content remains reachable through ordinary links and continues to work without JavaScript. The result is documentation first, with the shell as a way to explore it.

## Features

- A full-screen terminal interface with a command prompt, persisted history, tab completion and suggestions for unknown commands.
- A boot sequence on the home page: an Asciify-rendered Chroma Spiral field, an Old London `benji` wordmark and a pacman-style package confirmation. Direct links to other sections skip the boot screen, and entering the site is remembered for the rest of the tab session.
- A command set covering navigation, directory browsing and discovery: `help`, `about`, `projects`, `contact`, `cv`, `open`, `ls`, `cd`, `cat`, `neofetch`, `sections`, `whoami`, `pwd`, `date`, `clear`, `uninstall`, `theme`, `ascii` and `cursor`.
- Project case studies generated from a Markdown content collection, with status, year, role, technology tags, source links and plain-text image links.
- A rendered CV at `/cv/`, with a printable PDF and a direct download link.
- 22 Omarchy-derived colour themes, selectable from the command prompt and persisted in local storage.
- Eight ASCII character ramps and five cursor trail styles, backed by `asciify-engine`.
- Static 404 and legacy redirect pages, a generated sitemap and reduced-motion handling for the boot and prompt effects.

## Technologies

- **Astro:** static site generation, content collections, routing and image handling.
- **TypeScript:** typed data, command parsing, terminal file-system helpers and unit-tested utilities.
- **Plain CSS:** design tokens and component styles with no CSS framework.
- **asciify-engine:** ASCII boot field, wordmark, character sets and cursor trails.
- **Vitest:** unit tests for commands, paths, themes, effects and CV data.
- **Prettier and Astro check:** formatting and type checking in CI.
- **GitHub Actions and GitHub Pages:** continuous integration and deployment.

## Getting started

### Prerequisites

- Node.js 22 or later. The repository pins Node 22 in `.nvmrc` and requires `>=22.12.0` in `package.json`.
- npm with the committed `package-lock.json`.

### Installation

```bash
npm ci
```

### Development

```bash
npm run dev
```

The development server runs at `http://localhost:4321`.

### Validation

```bash
npm run check
npm run format:check
npm run test
npm run build
npm run preview
```

These are the same checks used by the CI workflow, which runs on pull requests and manual dispatch.

## Terminal commands

The prompt accepts the following commands. Paths are resolved against a small in-memory file system built from the project collection.

```text
help          list commands by category
about         open the profile page
projects      open the project index
contact       show email, GitHub, LinkedIn and Twitter details
cv            open the rendered CV
open <name>   open a project by slug or title
ls [path]     list the current or given directory
cd [path]     change directory; cd alone returns home
cat <path>    open a file or section, for example cat projects/cube
neofetch      show a short system-style profile
sections      list the main sections of the site
whoami        print a short profile summary
pwd           print the current path
date          print the current date and time
clear         clear the terminal screen
uninstall     remove benji-portfolio-git and return to the boot screen
theme [name]  list or switch the colour theme
ascii [name]  list or switch the ASCII character ramp
cursor [name] list or switch the cursor trail
```

Project commands are generated from the content collection, so a new project becomes available to `open` and `cat` without changing the terminal code.

## Adding a project

1. Create `src/content/projects/my-project.md`.
2. Add the required frontmatter: `title`, `summary`, `status`, `year`, `cover`, `coverAlt` and `tech`.
3. Add a cover and optional gallery images under `src/assets/projects/my-project/`.
4. Reference body images in the Markdown with repository-relative paths.
5. Run `npm run dev`; the page appears at `/projects/my-project/`.

The project index and homepage read from the content collection automatically. Set `featured: true` to include a project on the homepage.

## CV page

The CV at `/cv/` renders from `src/data/cv.json`. The printable PDF lives at `public/cv/BenjaminAnderson-CV.pdf`; the page links to it as a download. The website build does not require a TeX installation.

## Project structure

```text
Website/
├── src/
│   ├── assets/projects/       # Project images, optimised at build time
│   ├── components/            # Terminal boot, help, themes and redirects
│   ├── content/projects/      # Markdown project case studies
│   ├── data/                  # Commands, site profile, CV, themes and ASCII identity
│   ├── layouts/               # Full-screen terminal shell
│   ├── lib/                   # Command parser, paths, themes and project helpers
│   ├── pages/                 # Static routes, CV, 404 and legacy redirects
│   ├── scripts/               # Terminal, boot and cursor effects
│   └── styles/                # Design tokens and global styles
├── public/                    # CNAME, CV PDF, fonts, favicons and static images
├── tests/unit/                # Vitest unit tests
├── docs/redesign/             # Redesign investigation and implementation plan
├── scripts/pull-themes.mjs    # Regenerate src/data/themes.json from Omarchy
└── .github/workflows/         # CI and GitHub Pages deployment
```

## Deployment

The site builds to `dist/` and deploys through `.github/workflows/deploy.yml` on every push to `main`. GitHub Pages must use the **GitHub Actions** source rather than the legacy Jekyll builder.

The custom domain is `engiebenji.com`, set in the Pages settings and carried into the artefact by `public/CNAME`. HTTPS is enforced. The apex DNS records point to GitHub Pages; `www` uses a CNAME to `benjaminjanderson.github.io` and redirects to the apex.

Legacy URLs are preserved by `src/pages/[...legacy].astro` and `public/tags.html`. See `docs/redesign/implementation-plan.md` for the migration plan and `docs/redesign/content-inventory.md` for the original content decisions.

## Roadmap

- [ ] Generate small monochrome ASCII project previews at build time, keeping full-size image links alongside them.
- [ ] Explore a single-page terminal scrollback that updates the URL with `history.pushState` while retaining static route fallbacks.

These are exploratory ideas from `docs/redesign/future-ideas.md`, not completed functionality. CRT, scanline, glow and flicker effects are explicitly not planned.

## Credits and licensing

Third-party attributions are recorded in `THIRD_PARTY_NOTICES.md`:

- **asciify-engine** (MIT) for the ASCII boot field, wordmark and cursor effects.
- **Chroma Spiral** by ertdfgcvb for the spiral density used in the boot field, inspired by a Shadertoy work.
- **Old London** by Dieter Steffmann for the boot wordmark, used with permission.

This repository does not currently contain a licence file.
