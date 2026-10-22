# Future Ideas

## ASCII project previews

Project images are currently plain text links. A future exploration could
generate small monochrome ASCII previews from the cover and gallery images at
build time and print them in the terminal output.

Requirements to explore:

- Keep full-size image links alongside the previews.
- Generate previews deterministically at build time rather than in the browser.
- Keep the preview width within the terminal output on mobile.
- Do not turn project pages back into modern image galleries.
- Keep the existing content collection as the source of project metadata.

## Single-page terminal scrollback

The current implementation is multi-page: each command loads a terminal page.
A future exploration could keep one continuous scrollback and update the URL
with `history.pushState`, while still serving static route fallbacks for direct
links and no-JS users.

## Not planned

- CRT, scanlines, glow or flicker effects.
