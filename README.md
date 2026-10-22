# engiebenji.com

Personal engineering portfolio for Benjamin Anderson.

The production site is being rebuilt as a static Astro site on the
`redesign/astro` branch. The current live site remains on Jekyll until the
cutover is explicitly approved.

## Local development

```bash
npm ci
npm run dev
```

The dev server runs at `http://localhost:4321`.

## Validation

```bash
npm run check
npm run format:check
npm run test
npm run build
npm run preview
```

## Terminal interface

The site is a full-screen terminal. Every page boots with a Chroma Spiral
background and waits for a keypress or pointer press before revealing the
command prompt.

Available commands include `help`, `about`, `projects`, `contact`, `cv`,
`open <project>`, `ls`, `pwd`, `whoami`, `date`, `clear` and `cd <section>`.
Project commands are generated from the content collection.

Project images are linked as plain text rather than displayed inline. ASCII
image previews are a future exploration. The boot-screen spiral is a port of
Chroma Spiral by ertdfgcvb; see `THIRD_PARTY_NOTICES.md`. The boot also mounts an
Asciify `wordmark` for the BENJI identity through `asciify-engine/kit`.

## Adding a project

1. Create `src/content/projects/my-project.md`.
2. Add the required frontmatter: `title`, `summary`, `status`, `year`, `cover`, `coverAlt`, `tech`.
3. Add a cover and optional gallery images under `src/assets/projects/my-project/`.
4. Reference images in the Markdown body with relative paths.
5. Run `npm run dev`; the page appears at `/projects/my-project/`.

The project index and homepage read from the content collection automatically.
Set `featured: true` to include a project on the homepage.

## Structure

- `src/pages/` — static routes and dynamic project pages
- `src/content/projects/` — Markdown project case studies
- `src/assets/projects/` — project images optimized at build time
- `src/layouts/` — shared page shell and project layout
- `src/components/` — terminal boot and redirects
- `src/layouts/TerminalLayout.astro` — full-screen terminal shell
- `src/scripts/terminal.ts` — prompt, history, completion and output
- `src/scripts/boot-background.ts` / `boot-wordmark.ts` — boot spiral and Asciify wordmark
- `src/styles/` — terminal typography and layout
- `src/data/` — commands, site profile and ASCII identity
- `src/lib/` — command parser and project collection helpers
- `public/` — CNAME, CV, favicons, static redirects and project images
- `docs/redesign/` — investigation and implementation plan

## Deployment

The site is intended to deploy to GitHub Pages with a custom domain and HTTPS.
The Pages source and deploy workflow will only be switched after the redesign
has passed review. No experimental branch deploys to production.

See `docs/redesign/implementation-plan.md` for the full plan and
`docs/redesign/content-inventory.md` for the remaining M0 content decisions.
