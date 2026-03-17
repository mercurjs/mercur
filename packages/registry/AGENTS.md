# Registry Package Guide

This guide covers work in `packages/registry`.

Read this guide when a task touches:
- registry block source
- copied-code behavior
- install path assumptions
- registry metadata or generated outputs

For deep path-resolution details and copied-code edge cases, also consult [`CLAUDE.md`](CLAUDE.md).

## Scope

`packages/registry` owns:
- official registry block source files
- block metadata and registry build outputs
- registry-specific codegen for route types
- copied admin, vendor, API, workflow, and module source that downstream projects install

## Public Contract Surfaces

Treat these as public:
- registry file layout and path conventions
- block metadata and registry JSON output
- allowed imports inside copied source
- vendor/admin install resolution assumptions
- behavior of generated registry route types

## Preferred Patterns

- Preserve established path conventions for copied files.
- Keep registry source installable without repo-only aliases leaking into copied code.
- Reuse existing block layout patterns before introducing a new one.
- Consider both source readability and downstream install correctness.
- If block behavior changes, think through install destination, imports, and post-install usability together.

## Avoid

- Changing copied file paths without validating install consequences
- Using imports that work only inside this monorepo
- Changing registry metadata or generated outputs without noting compatibility impact
- Mixing path patterns casually between blocks without a reason

## Verification

After registry changes, verify the smallest relevant set:
- `bun run check-types`
- `bun run build` from `packages/registry` when source types changed
- `bun run codegen` from `packages/registry` when registry route typing changed
- `bun run build:registry` from `packages/registry` when metadata or output structure changed

If install behavior or copied source layout changed, manually inspect the affected block paths before closing the task.
