# Future Ideas

## ASCII project previews (implemented)

The projects index and case-study pages now generate monochrome ASCII cover and
gallery previews at build time with `sharp`. Full-size image links remain
alongside every preview. The implementation lives in `src/lib/ascii-image.ts`;
the pages stay static and no runtime canvas is required.

The original requirements are still respected:

- Full-size image links remain alongside the previews.
- Previews are generated deterministically at build time, not in the browser.
- Preview widths are constrained for mobile.
- Project pages are not modern image galleries.
- The content collection remains the source of project metadata.

## Project search and filtering

The index currently uses a compact `ls` table and status groups. Search and tag
filters would be worth adding once the collection grows beyond roughly six to
eight projects, where the single-screen case-file list no longer scans easily.

## Single-page terminal scrollback

The current implementation is multi-page: each command loads a terminal page.
A future exploration could keep one continuous scrollback and update the URL
with `history.pushState`, while still serving static route fallbacks for direct
links and no-JS users.

## Not planned

- CRT, scanlines, glow or flicker effects.
