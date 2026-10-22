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
npm run build
npm run preview
```

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
- `src/components/` — header, footer, project cards and redirects
- `src/styles/` — design tokens and global styles
- `src/data/` — site profile and ASCII identity
- `src/lib/projects.ts` — content collection helpers
- `public/` — CNAME, CV, favicons and static redirects
- `docs/redesign/` — investigation and implementation plan

## Deployment

The site is intended to deploy to GitHub Pages with a custom domain and HTTPS.
The Pages source and deploy workflow will only be switched after the redesign
has passed review. No experimental branch deploys to production.

See `docs/redesign/implementation-plan.md` for the full plan and
`docs/redesign/content-inventory.md` for the remaining M0 content decisions.
