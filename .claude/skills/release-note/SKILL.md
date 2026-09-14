---
name: release-note
description: Write the GitHub release note for a stable Mercur release from the auto-generated changelog and the merged PRs. Use when the user asks to "write / create / polish the release note" for a `vX.Y.Z` tag, pastes the auto-generated "What's Changed" list, or wants a release note in Mercur's voice.
argument-hint: "[vX.Y.Z]"
---

# release-note — Mercur GitHub release notes

Turn a release's merged PRs into a curated, human-readable note in Mercur's own voice. The reference is our v2.3.0 note and [`references/example-v2.3.4.md`](references/example-v2.3.4.md). Other projects' notes (e.g. Vendure) are inspiration for *structure* only — never copy their tone, section names, or length 1:1.

Use this skill when:
- a stable tag (`vX.Y.Z`) was pushed and the auto-generated note needs replacing
- the user pastes the "What's Changed" list and asks for a proper note

## Workflow

1. **Collect the PR list.** Use what the user pasted, or:
   ```bash
   gh release view vX.Y.Z --json body -q .body
   ```
   The range is the previous **stable** tag → this tag (`vX.Y.(Z-1)...vX.Y.Z`), not the last canary. The GitHub "View changes" link from changelogithub points at the last canary and is wrong for this purpose.
2. **Filter.** Drop:
   - every `chore: vX.Y.Z-canary.N` / `-rc.N` / `chore: vX.Y.Z` version bump
   - change + revert pairs that net to zero (e.g. a pin and its rollback)
   - a feature, its revert, and its re-land collapse into **one** entry citing the re-land PR
3. **Read the substantive PRs** — titles are not enough to explain impact:
   ```bash
   gh pr view <n> --json body -q .body
   ```
   Always read `!` (breaking) PRs, `feat` PRs, and anything touching migrations, config (`withMercur`, feature flags) or Medusa versions.
4. **Draft** into the scratchpad as `release-notes-vX.Y.Z.md` using the format below, then send it to the user for review.
5. **Publish only after the user approves:**
   ```bash
   gh release edit vX.Y.Z --notes-file <path>
   ```

## Format

```markdown
# Mercur vX.Y.Z

<2–4 sentence intro: the theme of the release, the headline features, the Medusa bump if any, "plus a batch of fixes">

## ⚠️ Before you upgrade
<only if needed: breaking changes (from `!` PRs), migrations to run, config/flag changes. Short bullets with PR refs.>

## ✨ Highlights

### <emoji> <Feature name>
<2–4 sentences: what it enables for an operator/vendor/developer, the hook/API name in backticks, what happens if you don't opt in. (#PR)>

### 🧩 More extension points
- <smaller additive seams, one line each (#PR)>

### Platform
- **Bump Medusa to X.Y.Z** (#PR).

## 🐛 Fixes
- <imperative, one line, user-visible effect (#PR)>

## 📚 Docs
- <docs PRs (#PR)>

## 🙌 New contributors
- @handle made their first contribution in #PR — thank you!

**Full Changelog**: https://github.com/mercurjs/mercur/compare/vPREV...vX.Y.Z
```

## Rules

- **Voice:** friendly, concise, product-first ("sellers can now…", "lets a plugin…"). Not a security advisory, no tables, no exhaustive per-file detail.
- **Group by impact, not by package.** Features go in Highlights; small additive hooks go under "More extension points"; everything else is a Fix.
- Every bullet cites its PR as `(#1234)`. Omit sections that would be empty.
- Breaking changes must name the removed endpoints/fields/links concretely so users can grep for them.
- Mention migrations whenever a PR adds columns or a `Migration*` file.
- Don't invent behaviour — if a PR body doesn't say it, don't claim it.
- No AI attribution in the note.
