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

## Structure

- `src/pages/` — static routes
- `src/layouts/` — shared page shell
- `src/components/` — header, footer and project cards
- `src/styles/` — design tokens and global styles
- `src/data/` — navigation, project and profile data
- `public/` — CNAME, CV, images and favicons copied to the build
- `docs/redesign/` — investigation and implementation plan

## Deployment

The site is intended to deploy to GitHub Pages with a custom domain and HTTPS.
The Pages source and deploy workflow will only be switched after the redesign
has passed review. No experimental branch deploys to production.

See `docs/redesign/implementation-plan.md` for the full plan and
`docs/redesign/content-inventory.md` for the remaining M0 content decisions.
