# Contributing to Mercur

We’re excited to collaborate with folks building on top of Mercur. This guide explains how we organize releases, structure branches, and prepare pull requests so changes land smoothly.

## Branch Model

- `main` – main branch containing release-ready code. Base regular feature work off `main`.
- Topic branches – create a dedicated branch per change using the format `feat/<concise-feature-name>` (for example `feat/vendor-product-export`). Use other prefixes when appropriate (`fix/`, `chore/`, `docs/`).

## Working on Features

- Branch from `main`, keeping it up to date via `git pull --rebase origin main`.
- Keep commits scoped and descriptive. Squash locally if it clarifies the story.
- Follow module conventions from [`CLAUDE.md`](CLAUDE.md) and prefer the `packages/` workspace for new code.

## Pull Requests

- Open PRs against `main`.
- Describe the user impact, architectural notes, and testing performed (lint, unit, integration, CLI).
- Ensure the branch merges cleanly and CI is green before requesting review.
- Reference related issues or discussions; add screenshots or recordings for UI tweaks.
- Tag maintainers early if you need design or architectural guidance.

## Helpful Resources

- 📚 Documentation: [docs.mercurjs.com](https://docs.mercurjs.com)
- 🧠 Agents & architecture guide: [`CLAUDE.md`](CLAUDE.md)
- 💬 Community discussions and issues: [GitHub issues](https://github.com/mercurjs/mercur/issues)

Thanks for helping us build a more extensible, AI-ready marketplace platform!
