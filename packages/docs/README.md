# @mercurjs/docs

Bundled Mercur documentation, shipped as a dependency so AI agents can read it
locally — offline and version-matched to the installed packages.

## For agents

1. Read `llms.txt` — a grouped index of every page with its description.
2. Open the referenced file under `content/` for the full page before implementing.

Paths in `llms.txt` are relative to this package
(`node_modules/@mercurjs/docs/`).

## Contents

- `llms.txt` — the index.
- `content/**/*.mdx` — the documentation pages, mirroring the structure of the
  docs site (`learn/`, `resources/`, `tools/`, `references/`, `user-guide/`,
  `migration/`).

## Build

`content/` and `llms.txt` are generated from the root of `apps/docs`
(archived versions such as `apps/docs/v1` are excluded) by
`scripts/build.mjs` (run via `turbo run build`). They are not committed.
