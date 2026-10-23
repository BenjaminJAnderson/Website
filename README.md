# engiebenji.com

Personal engineering portfolio for Benjamin Anderson.

The site is a static Astro build presented as a full-screen terminal and
deployed to GitHub Pages with a custom domain and HTTPS. The legacy Jekyll site
has been removed.

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

The site is a full-screen terminal. The first page load in a tab shows an
Asciify-generated Chroma Spiral hero, an Old London `benji` wordmark and a
pacman-style package confirmation. Entering the site reveals the command prompt
and is remembered for the rest of the tab session. Run `uninstall` in the
terminal to remove `benji-portfolio-git` and return to the boot screen.

Available commands include `help`, `about`, `projects`, `contact`, `cv`,
`open <project>`, `ls`, `pwd`, `whoami`, `date`, `ascii`, `clear`, `uninstall`
and `cd <section>`.
Project commands are generated from the content collection.

Project images are linked as plain text rather than displayed inline. ASCII
image previews are a future exploration. The boot background and `benji`
wordmark both run through `asciify-engine/kit`; see `THIRD_PARTY_NOTICES.md`.

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
- `src/scripts/boot-hero.ts` / `boot-wordmark.ts` / `boot-pacman.ts` — boot field, wordmark and pacman confirmation
- `src/styles/` — terminal typography and layout
- `src/data/` — commands, site profile and ASCII identity
- `src/lib/` — command parser and project collection helpers
- `public/` — CNAME, CV, favicons, static redirects and project images
- `docs/redesign/` — investigation and implementation plan

## Deployment

The site builds to `dist/` and deploys through
`.github/workflows/deploy.yml` on every push to `main`. GitHub Pages must use
the **GitHub Actions** source rather than the legacy Jekyll builder.

The custom domain is `engiebenji.com`, set in the Pages settings and carried
into the artifact by `public/CNAME`. HTTPS is enforced. The apex DNS records
point to GitHub Pages; `www` uses a CNAME to `benjaminjanderson.github.io` and
redirects to the apex.

Legacy URLs are preserved by `src/pages/[...legacy].astro` and
`public/tags.html`.

See `docs/redesign/implementation-plan.md` for the migration plan and
`docs/redesign/content-inventory.md` for the original content decisions.
