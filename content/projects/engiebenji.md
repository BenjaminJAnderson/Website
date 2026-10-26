---
title: "ENGIEBENJI"
summary: "An Astro terminal portfolio that keeps its own case study in sync with GitHub, with a cached fallback when the remote file is unavailable."
status: "in-progress"
year: 2022
period: "2022 —"
role: "Design, build and writing"
tech: ["Astro", "TypeScript", "GitHub Actions", "GitHub Pages"]
tags: ["website", "writing", "static-site", "automation"]
cover: "../../assets/projects/engiebenji/cover.webp"
coverAlt: "Illustration of a laptop and documents representing the website build."
gallery: []
repo: "https://github.com/BenjaminJAnderson/Website"
featured: true
order: 3
draft: false
---

## Overview

ENGIEBENJI is the site you are reading. It is a static Astro build presented as a
full-screen terminal, with project pages, an in-browser CV and a small command
prompt that treats the website like a shell. The site is deployed to GitHub Pages
at [engiebenji.com](https://engiebenji.com/).

The project began in 2022 as a Jekyll blog and was rebuilt in Astro to give the
terminal a proper component model, typed content collections and a static build
that stays compatible with GitHub Pages.

## From Jekyll to Astro

The original site used Jekyll because it was simple, free to host and built
directly from Markdown. That worked well for a handful of posts, but the terminal
interface needed more structure than Liquid templates and ad-hoc JavaScript could
comfortably provide.

The Astro rebuild keeps the static output and brings the content into a typed
collection. Each project is a Markdown file with frontmatter for its title,
summary, status, year, role, technology tags, cover and gallery. The project
index, homepage and terminal commands all read from that collection, so adding a
project does not require editing a navigation list or a command switch.

## A terminal, but still a website

The terminal is the visual identity and a navigation layer, not a replacement
for the web. Every command resolves to a real URL: `projects` opens
`/projects/`, `open cube` opens `/projects/cube/` and `cat cv` opens the rendered
CV. Ordinary links, the command prompt, search engine crawlers and the no-script
fallbacks all reach the same static pages.

The prompt supports history, tab completion and suggestions for unknown
commands. The boot screen runs once per tab session and can be replayed with
`uninstall`. Layout commands switch between 22 themes, several ASCII character
ramps and a set of cursor trails.

## Keeping this case study on GitHub

This page is the first project to use the site's remote content sync. The
canonical Markdown file lives at `content/projects/engiebenji.md` in the
[Website repository](https://github.com/BenjaminJAnderson/Website) and is fetched
at build time. The sync script validates the frontmatter and body, then writes
the content collection copy at `src/content/projects/engiebenji.md`.

If GitHub is unreachable, the remote file has been removed, or its frontmatter
no longer validates, the build keeps the last cached copy instead of failing.
That cache is committed, so a fresh checkout still has a usable fallback. The
goal is a GitHub-first workflow without turning a network outage or a bad edit
into a broken deployment.

## Deployment

The site builds to `dist/` through GitHub Actions and deploys to GitHub Pages on
every push to `main`. The custom domain is `engiebenji.com`; HTTPS is enforced.
Legacy Jekyll URLs redirect to their Astro equivalents, and the sitemap is
generated at build time.

## What's next

The remote sync currently covers this page only. Once the fallback behaviour has
been proven in normal use, the same manifest can point the other project pages at
their own repositories.
