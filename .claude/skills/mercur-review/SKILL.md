---
name: mercur-review
description: Review a Mercur change (current diff, branch or PR) with a swarm of independent reviewer agents, triage their findings into actionable / nit / ambiguous, fix the actionable ones and loop until clean. Use when the user asks to review, QA, check or "make this match Medusa" before a PR, or says the code looks AI-generated or off-pattern.
argument-hint: "[PR number | branch | path] [--no-fix]"
---

# mercur-review — QA swarm, triage, loop

A swarm of independent reviewers, a triage pass and an outer loop. The goal: the user should not have to point out Medusa patterns, naming or slop by hand. The reviewers do it, the fixes land, and only judgment calls reach the user.

Three rules hold throughout:

1. **The author does not review its own work.** Every reviewer is a fresh subagent that sees the diff and the reference files, never your reasoning or the conversation that produced the code.
2. **Different lenses, not more of the same.** Each reviewer has one narrow brief (below). Overlap is wasted tokens.
3. **Verify by observation, not reasoning.** A finding is fixed when a command shows it fixed (typecheck, spec, request), not when an explanation says so.

## 1. Scope the change

- No argument: `git diff main...HEAD` plus the working tree. A PR number: `gh pr diff <n>`. A path: that path's diff against `main`.
- Write the changed file list and the diff to the scratchpad. Reviewers read from there.
- Note which surfaces the diff touches (`packages/core` api / workflows / modules, `packages/admin`, `packages/vendor`, `packages/dashboard-shared`, plugins, docs). Skip reviewers whose surface isn't touched.

## 2. Swarm: spawn the reviewers in parallel

Launch these in **one message** as `general-purpose` agents. Give each the scratchpad diff path, its brief from `references/reviewers.md`, and the reference file it checks against. Each returns findings only. No fixes.

| Reviewer | Lens | Checks against |
| --- | --- | --- |
| `medusa-patterns` | Does it look like Medusa wrote it: routes, workflows, steps, module service, links, query config | `references/medusa-backend.md` + `~/Desktop/medusa` |
| `dashboard-patterns` | Does the UI look like the surrounding admin/vendor pages | `references/dashboard-ui.md` + `docs/UI-ARCHITECTURE.md` |
| `qa-technical` | Correctness, data integrity, DB / query cost, transactions, races, empty-input edge cases | the diff + touched callers |
| `security` | Authz/seller scoping, injection, secrets, webhook trust, unvalidated input | the diff |
| `taste` | Naming, AI-slop comments and copy, dead code, over-abstraction, file size, `any` | `CLAUDE.md` Writing Code + `references/reviewers.md` |

Only spawn `dashboard-patterns` for UI diffs and `medusa-patterns` for backend diffs. Keep the swarm at five agents or fewer.

Every finding uses this shape:

```
- file:line — what is wrong (one sentence)
  evidence: the Medusa/Mercur file that does it right, or the concrete failure
  fix: the smallest change that resolves it
  class: actionable | nit | ambiguous
```

A finding with no evidence is dropped. "Medusa does X" needs a path in `~/Desktop/medusa` or an existing Mercur file.

## 3. Triage

Merge the findings and dedupe them by file and line. Then sort:

- **Actionable**: a clear defect or pattern break with one obvious fix (thin a route, move a step into its own file, add compensation, use `Form.Field`, drop an AI comment). Fix it.
- **Nit**: style with no behavior impact and no established convention behind it. List it once and don't fix it unless it's trivial and in a line already being edited.
- **Ambiguous**: the fix changes behavior, an API contract, a migration, or product copy, or two reviewers disagree. Don't fix it; collect it for the user with a recommendation.

Be honest: a finding that would change a public route's response, a workflow's input/output, or an event payload is **ambiguous**, not actionable.

## 4. Fix and verify

Apply the actionable fixes yourself, then verify by observation:

- `bunx tsc --noEmit -p <package>/tsconfig.json` for each touched package (filter to touched files; some packages have pre-existing errors)
- `bunx oxlint --quiet <touched paths>`
- Backend: `bun run test:integration:http -- <spec for the touched endpoints>` (never the whole suite); unit specs with `bun test <path>`
- Plugin or dashboard changes: that package's build (`bun run build` in the plugin, `bunx tsup` in `packages/admin` / `packages/vendor`)
- Never start the Playwright/e2e harness or drive the browser unless the user asks. For UI, report what the user should look at.

A fix that fails verification is reverted and reclassified as ambiguous.

## 5. Loop

Re-run the swarm on the **new** diff (only the reviewers whose surface changed), triage again, and fix again. Stop after **3 rounds**, or as soon as a round produces no new actionable findings. Don't re-raise findings already classified as nit or ambiguous.

`--no-fix`: run one round, skip step 4, and report.

## Output

Report to the user, in this order:

1. **Fixed**: one line per actionable fix, `file:line`, with the verification command that proved it.
2. **Needs your call**: the ambiguous items, each with the tradeoff and a recommended option.
3. **Nits** (collapsed, optional to act on).
4. Rounds run and what was verified (typecheck / lint / specs / builds), plus anything that couldn't be run.

Do not commit or push unless the user asks.
