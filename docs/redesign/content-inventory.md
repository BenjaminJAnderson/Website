# Redesign M0 — Decisions and Content Inventory

**Status:** decisions approved 2026-10-22; final content still being collected<br />
**Branch:** `redesign/astro`<br />
**Purpose:** record the approved M0 decisions and the content still needed for M2/M4.

---

## 1. Approved decisions

These defaults were approved on 2026-10-22. Amend any entry here if the direction changes.

| # | Decision | Recommended default | Status |
|---|---|---|---|
| 1 | Framework | Astro 6 static site | Approved (Astro 6.4.8) |
| 2 | Hosting | Keep GitHub Pages, custom domain and HTTPS; deploy with GitHub Actions | Approved (recommended default) |
| 3 | Migration | Convert CUBE, ORTHODOX and ORIGIN; preserve `/about/`, `/contact/`, `/cv/`; redirect old post URLs and `/ideas/` | Approved (recommended default) |
| 4 | Terminal | Full-screen terminal shell; commands open real routes; terminal boot on every load | Revised 2026-10-22 |
| 5 | Visual direction | Dark-only monochrome; no CRT, scanlines or glow | Approved (recommended default) |
| 6 | Project photos | UI monochrome; photos slightly desaturated but still in color | Approved (recommended default) |
| 7 | About identity | Original ASCII portrait if a suitable photo is supplied; otherwise a custom wordmark/circuit graphic | Approved (recommended default) |
| 8 | Dot-matrix footer | `ENGIEBENJI` desktop, `BENJI` or compact glyph mobile; circles; touch pulse; static reduced-motion mode | Approved (recommended default) |
| 9 | Contact | `mailto:` + copy email; no Formspree dependency | Approved (recommended default) |
| 10 | Blog/notes | Keep ORIGIN as a note or project case study; no full blog unless more writing is planned | Approved (recommended default) |
| 11 | Comments/analytics/search | None in v1 | Approved (recommended default) |
| 12 | Licensing | MIT for original code; personal content and images © Benjamin Anderson; third-party notices | Approved (recommended default) |
| 13 | Deployment | Approve Pages source switch and cutover window after M6 | Approved in principle; final go-ahead before M7 |

---

## 2. Known content and assets

### Existing project write-ups

| Current source | Proposed destination | Status / notes |
|---|---|---|
| `_posts/2022-09-18-CUBE.md` | `src/content/projects/cube.md` | Existing text and images; needs frontmatter, editing and screenshot selection |
| `_posts/2022-09-18-ORTHODOX.md` | `src/content/projects/orthodox.md` | Existing text and images; needs frontmatter, editing and screenshot selection |
| `_posts/2022-02-01-ORIGIN.md` | `src/content/projects/engiebenji.md` or `src/content/notes/origin.md` | Decide whether this is a project case study or a note |
| `_pages/about/about.md` | `src/pages/about.astro` | Short bio; expand into the neofetch-style layout |
| `_pages/contact/contact.html` | `src/pages/contact.astro` | Replace form with mailto/copy or keep Formspree if approved |
| `_pages/ideas/ideas.html` | Redirect to `/contact/` | Duplicate contact form; not a real ideas page |

### Existing local assets

| Asset group | Current location | Proposed use |
|---|---|---|
| CUBE images | `images/cube.webp`, `display.webp`, `inside_cube.webp`, `motherboard.webp`, `pcb.webp`, `pcb_frame.webp`, `unfolded_frame*.webp` | CUBE project cover and gallery |
| ORTHODOX images | `images/orthodox.webp`, `keyboardlayout.webp`, `keyboardmotherboard.webp`, `keyswitchmatrix.webp`, `case.webp`, `mag_frame.webp`, `pcb_mouse.webp` | ORTHODOX project cover and gallery |
| Site/other images | `images/origin.webp`, `about.webp`, `buttons.webp`, `onewheel.webp`, `umlzlg1om2671.png` | ORIGIN/note, About, or archive |
| CV | `cv/BenjaminAnderson-CV.pdf` | Copy to `public/cv/BenjaminAnderson-CV.pdf` |
| Favicons/manifest | Root PNG/ICO/SVG and `site.webmanifest` | Copy into `public/` |
| CNAME | `CNAME` | Copy to `public/CNAME` |

All image ownership and permission should be confirmed before publication.

### Content still needed

- [ ] Final project list, including any projects not already in the Jekyll posts.
- [ ] Per project: title, one-line summary, longer description, status, year, role, technology tags, repository URL, demo URL, screenshots and captions.
- [ ] Confirmed About copy: role, location, education, skills/tools, interests, current work and links.
- [ ] Confirmed contact email and social links.
- [ ] Decision on the ORIGIN post: project page or note.
- [ ] Decision on the About identity: portrait-based ASCII or custom wordmark/circuit graphic.
- [ ] A suitable high-contrast photo for the ASCII portrait, if that option is chosen.
- [ ] Confirmed dot-matrix wordmark and mobile variant.
- [ ] Confirmed licence choice and any third-party notices.

---

## 3. URL migration map

Preserve:

| Old URL | New URL |
|---|---|
| `/about/` | `/about/` |
| `/contact/` | `/contact/` |
| `/cv/BenjaminAnderson-CV.pdf` | `/cv/BenjaminAnderson-CV.pdf` |

Redirect:

| Old URL | New URL |
|---|---|
| `/2022/09/18/CUBE/` | `/projects/cube/` |
| `/2022/09/18/ORTHODOX/` | `/projects/orthodox/` |
| `/2022/02/01/ORIGIN/` | `/projects/engiebenji/` or `/notes/origin/` |
| `/ideas/` | `/contact/` |
| `/tags.html` | `/projects/` |
| `/search.json` | `/projects/` or remove |
| `/feed.xml` | New RSS feed if notes are retained; otherwise redirect to `/` |

---

## 4. M0 acceptance criteria

M0 is complete when:

- [ ] Decisions 1–13 are approved or amended.
- [ ] The final project list is known.
- [ ] Project copy and media requirements are known.
- [ ] About copy and identity approach are approved.
- [ ] Contact method is approved.
- [ ] The URL redirect map is approved.
- [ ] Licence choice is approved.
- [ ] There are no remaining blockers for M1.

Implementation note: M1 was started after the recommended defaults were approved. Final project copy, the ORIGIN decision and the ASCII identity asset remain M2/M4 inputs.

---

## 5. M2 status — 2026-10-22

- Astro content collection added in `src/content.config.ts`.
- CUBE, ORTHODOX and ENGIEBENJI migrated to `src/content/projects/`.
- Project images moved to `src/assets/projects/<slug>/` and optimized at build time.
- `/projects/` and `/projects/<slug>/` are generated from the collection.
- Legacy post URLs and `/ideas/` redirect to their new pages.
- `/tags.html` redirects to `/projects/`.

Still outstanding:

- Final copy for any projects not yet represented.
- Additional project screenshots and diagrams.
- Final decision on whether ORIGIN should remain a project case study or move to a notes section.
- Original ASCII identity artwork for M4.


---

## 6. M3 status — 2026-10-22

The original modal-palette implementation was replaced after visual review.

- Full-screen terminal shell with status line, scrollback and fixed prompt.
- Terminal boot sequence on every page load, with an Asciify Chroma Spiral background, an Old London `benji` wordmark and a pacman-style confirmation; running `uninstall` in the terminal resets the site to the boot screen.
- All page chrome, cards, buttons, hero sections and modern layouts removed.
- JetBrains Mono only; Inter removed.
- About, Projects, Contact and project pages converted to terminal output.
- Project images converted to plain text links.
- Command parser, aliases, history, Tab completion and suggestions retained.
- No CRT or scanline effects.
- Unit tests, no-JS fallback markup, reduced-motion behaviour and mobile layout are in place and should be re-checked during final review.
