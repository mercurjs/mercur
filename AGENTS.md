# AGENTS.md

Repo-wide pointers for coding agents. See `CLAUDE.md` for the full project instructions and required reading (`docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/UI-ARCHITECTURE.md`).

## Design → code (Figma)

When the task is turning a **Figma design into dashboard UI code** — the user shares a `figma.com` URL, selects a Figma node, or asks to "convert / implement / build this design / screen / mockup" in `packages/admin` or `packages/vendor` — load the **`figma-ui`** skill at `.claude/skills/figma-ui/SKILL.md` first.

It reads the design from the Figma MCP (`get_screenshot` as the source of truth, `get_metadata` for structure) and maps it onto the design-system conventions before writing JSX:

- `.claude/skills/figma-ui/references/components.md` — which primitive + variant to render for each element (the component inventory).
- `.claude/skills/figma-ui/references/spacing.md` — the spacing scale + Medusa UI color/typography/effect tokens.
- `.claude/skills/figma-ui/references/patterns.md` — sections, modals, forms, destructive actions, i18n, test ids, and the do-not list.

The deterministic gate is `bun run lint` + `bun run build`; keep both green.
