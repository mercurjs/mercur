---
name: linear-task
description: Pick up a Linear issue from a URL or identifier, drive it end-to-end (read → implement → verify → PR to `canary`), and manage the Linear status columns ("In Progress" → "Waiting For Review", or "Blocked") along the way. Trigger whenever the user pastes a Linear URL (e.g. https://linear.app/rigbyjs/issue/MER-130/...) or a bare identifier like `MER-130`, or says things like "work on", "pick up", "implement", "take this ticket", "do this Linear task", or "ship this issue". Also trigger when the user describes the workflow in their own words ("move it to in progress, do the work, then open a PR") even without naming Linear. Prefer this skill over implementing-and-then-asking-about-status, because the column transitions are the contract: the rest of the team relies on them.
---

# linear-task

Linear is the source of truth for what needs doing. PRs are how work gets reviewed. This skill connects the two so the human doesn't have to babysit the status column or remember the branch naming convention.

## Inputs you accept

- A full Linear URL: `https://linear.app/rigbyjs/issue/MER-130/<slug>`
- A bare identifier: `MER-130`
- A Linear URL with a comment fragment — strip it, use the issue ID

Extract `MER-NNN` from whatever the user gave you. That's the only thing the rest of the workflow needs.

## The workflow

These steps run in order. Each one has a "stop and ask" condition; respect them — half-finished automation is worse than asking once.

### 1. Fetch the issue

Call `mcp__claude_ai_Linear__get_issue` with `id="MER-NNN"` and `includeRelations=true`. Read:

- `title` — for the commit and PR title
- `description` — the spec; this is what you implement
- `gitBranchName` — Linear's canonical branch name for this issue. Use this exactly; the team grep PRs by it.
- `attachments` — screenshots, design links, Figma references; load them if they look relevant
- `state.name` — if it's already `Done`, `Waiting For Review`, or `Canceled`, stop and ask the user whether they really meant to reopen it.

Re-read the description carefully. Most "blocked" outcomes come from skimming the spec and missing a constraint that was right there.

### 2. Stay out of the main checkout — use a worktree

You do *not* switch branches in the user's current working tree. The user may be mid-flight on something else; you must not touch their files. Instead, every ticket gets its own `git worktree` next to the repo. This means:

- Their main checkout stays exactly as they left it (any branch, any dirty files).
- `bun install`, builds, and the dev server run in the worktree without colliding with their main checkout.
- After the PR merges, the worktree is removed in one command and nothing in the main tree changed.

Before creating the worktree, just confirm `origin/canary` is fresh:

```bash
git fetch origin canary
```

You don't need to check `git status` of the main tree — you're not going to write to it.

### 3. Move the issue to "In Progress"

Call `mcp__claude_ai_Linear__save_issue` with `id="MER-NNN"` and `state="In Progress"`. This signals to the team that the ticket is being worked on. Do this *before* writing code, not after — otherwise two people can pick up the same ticket.

Optional: post a short comment via `mcp__claude_ai_Linear__save_comment` saying "Picking this up." Skip if the issue already has recent activity from you.

### 4. Create the worktree

The worktree lives as a sibling directory to the main repo, named after the issue identifier so multiple parallel tickets are easy to tell apart. From the main repo root:

```bash
WORKTREE="../mercur-MER-NNN"        # sibling of the current repo dir
git worktree add "$WORKTREE" -b <gitBranchName> origin/canary
cd "$WORKTREE"
bun install                          # node_modules is per-worktree; install before building
```

Use Linear's `gitBranchName` verbatim (the team greps PRs by it).

Existing-state cases — handle them, don't paper over them:

- **Worktree path already exists** (`mercur-MER-NNN` is there from a previous attempt): cd into it, `git fetch origin canary && git rebase origin/canary`, and reuse it. Don't blow it away — it may already contain progress.
- **Branch with `gitBranchName` already exists** but no worktree: `git worktree add "$WORKTREE" <gitBranchName>` (without `-b`) attaches the existing branch. Then rebase as above.
- **Both already exist and the branch has commits you didn't make**: stop and ask the user before doing anything destructive. Someone else may have been working on this ticket.

Everything from this step onward — edits, commits, `bun run lint`, `bun run build`, tests, `gh pr create` — runs inside the worktree. The user's main checkout is never touched.

### 5. Implement

This is the part that varies by ticket. Anchor on:

- **`CLAUDE.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/UI-ARCHITECTURE.md`** — already in your context. The team's conventions live there; follow them.
- **Existing skills** — if the ticket touches admin pages, forms, or tabs, the `admin-page-ui` / `admin-form-ui` / `admin-tab-ui` / `medusa-ui-conformance` skills already encode the rules. Use them; don't re-derive.
- **Tests** — per `CLAUDE.md`: bug fixes and new features must include tests. For a reproducible bug, write the failing test first.
- **Conventional Commits** — `feat(scope):`, `fix(scope):`, `docs:`, `chore:`, `refactor(scope):`. `!` for breaking changes. The scope usually matches the Mercur area (e.g. `orders`, `admin`, `vendor`, `core`).

If during implementation you hit something you can't resolve without input — credentials you don't have, an ambiguous spec where two valid interpretations would produce different UX, a dependency on work in another repo — that's a real blocker. Go to step 7b.

### 6. Verify

Run, in order, and fix anything that fails before moving on:

```bash
bun run lint     # type-check + lint
bun run build    # compile every package
```

If the change touches integration-tested code, run the relevant pattern:

```bash
bun run test:integration:http -- <pattern>      # never the bare form — it runs everything
bun run test:integration:tests
```

For UI changes, follow the `verify` skill's pattern — run the app, exercise the feature in a browser, watch for regressions in adjacent flows. Type-checks pass ≠ feature works.

If something fails and you can fix it, fix it. If it fails in a way that reveals a real blocker (e.g. the test surfaces a missing API the spec assumed exists), go to step 7b.

### 7a. On success: open the PR and move to "Waiting For Review"

```bash
git add <specific files — not -A>
git commit -m "<type>(<scope>): <imperative summary>

<optional body explaining why, not what>

Refs MER-NNN

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"

git push -u origin <gitBranchName>

gh pr create --base canary --title "<same as commit subject>" --body "$(cat <<'EOF'
## Summary
<1-3 bullets — what changed and why>

## Linear
[MER-NNN](https://linear.app/rigbyjs/issue/MER-NNN)

## Test plan
- [ ] <how to verify manually, if applicable>
- [ ] `bun run lint`
- [ ] `bun run build`
- [ ] `bun run test:integration:http -- <pattern>` (if relevant)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Then in Linear:

1. Post a comment with the PR URL via `mcp__claude_ai_Linear__save_comment` — `issueId="MER-NNN"`, `body="PR: <url>"`. Linear's GitHub integration will auto-link if installed, but the explicit comment is the durable signal.
2. Move the issue: `mcp__claude_ai_Linear__save_issue` with `id="MER-NNN"`, `state="Waiting For Review"`.

Return the PR URL to the user as the last line of your response.

### 7b. On blocked: move to "Blocked" with a real explanation

A blocker is something you cannot resolve by trying harder or by reading more code. Examples:

- The spec contradicts an existing API contract and the right resolution is a product call.
- You need credentials, access to a third-party dashboard, or a Stripe test account you don't have.
- The ticket depends on a workflow that doesn't exist yet and the user hasn't said to build it.
- An ambiguity where two reasonable implementations would behave differently for the end user.

Not blockers (keep working):

- Tests are failing — debug them.
- Type errors — fix them.
- You're not sure which file to edit — read more, grep, ask the user a quick question without changing column.

When it's a real blocker:

1. Stop implementing. Do not push partial work.
2. Post a comment via `mcp__claude_ai_Linear__save_comment` with:
   - **What you tried** (one or two sentences).
   - **Where you got stuck** (the specific question or missing piece).
   - **What you need to unblock it** (a decision, an account, a confirmation, etc.).
3. Move the issue: `mcp__claude_ai_Linear__save_issue` with `id="MER-NNN"`, `state="Blocked"`.
4. Tell the user the same summary in chat, and ask the question that would unblock it.

If the user gives you what you need in the same conversation, move the issue back to "In Progress" and continue from step 5.

## When to stop and ask the user

Auto mode is fine for the happy path, but these warrant a confirmation:

- The issue is already `Done`, `Waiting For Review`, or `Canceled` (step 1).
- A worktree or branch for `gitBranchName` already exists with unfamiliar commits (step 4).
- The spec is ambiguous in a way that affects user-visible behavior (step 5).
- You're about to force-push, amend a pushed commit, or skip a hook (never; always ask).
- The diff is much larger than the ticket implies — possible scope creep.

## Mercur-specific defaults

- **Base branch:** `canary`. Never target `main` directly from this skill.
- **Repo:** `mercurjs/mercur`.
- **Linear team:** `MER`.
- **Status names** are exact: `In Progress`, `Waiting For Review`, `Blocked`. They're case-sensitive in Linear's UI but `save_issue` matches by name; if a lookup fails, list statuses with `mcp__claude_ai_Linear__list_issue_statuses` and use the ID instead.
- **Package manager:** `bun` only. Never `npm`/`yarn`/`pnpm` — this is enforced repo-wide.
- **Spec tracker:** if the ticket maps to a `docs/specs/SPEC-*.md`, update its `status`, `last_updated`, and `Evidence` section as part of the change. See `CLAUDE.md` for the full Definition of Done.

## After merge

Once the PR is merged, the worktree and branch are no longer needed. The skill does not delete them automatically (see "What this skill does NOT do"), but the user can clean up with:

```bash
git worktree remove ../mercur-MER-NNN
git branch -d <gitBranchName>
```

If the worktree has uncommitted changes you actually want to keep, `git worktree remove --force` will refuse — that's the point. Commit or stash inside the worktree first.

## What this skill does NOT do

- It does not merge PRs. Review and merge are human steps.
- It does not delete worktrees or branches.
- It does not edit `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, or `docs/UI-ARCHITECTURE.md` unless the ticket explicitly asks for it.
- It does not bypass pre-commit hooks. If a hook fails, fix the underlying issue and create a new commit.
