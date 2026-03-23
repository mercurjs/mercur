# Migration Difficulty Decision Tree

Use this tree to classify a project before starting migration.

## Step 1: Custom modules?

Does the 1.x project have custom MedusaJS modules (not from `@mercurjs/b2c-core` or standard packages)?

- **No** → go to Step 2
- **Yes** → classify as **heavy-custom** (minimum)

## Step 2: Custom workflow count

How many custom workflows exist (beyond those provided by Mercur packages)?

- **0** → go to Step 3
- **1–5** → go to Step 3 (light-custom candidate)
- **> 5** → go to Step 4

## Step 3: Custom endpoints

How many custom API endpoints exist?

- **0** → **Starter**
- **1–10** with ≤ 5 workflows → **Light custom**
- **> 10** → **Heavy custom**

## Step 4: Dashboard customization

How extensive are admin/vendor dashboard changes?

- **No custom pages, only config** → stays at current level
- **< 5 custom pages, no custom extensions** → stays at current level
- **Custom pages + widget zones + custom hooks** → **Heavy custom**

## Step 5: Third-party integrations

Does the project use integrations beyond what 2.0 supports?

- **No** (only Stripe standard, Algolia via block, etc.) → stays at current level
- **Yes** (Stripe Connect, Resend, TalkJS, custom providers) → elevate to at least **light-custom**, check `docs/migrations/mercur-1.x-to-2.0/README.md` for the known-gaps section

## Summary Matrix

| Indicator | Starter | Light Custom | Heavy Custom |
|-----------|---------|-------------|-------------|
| Custom modules | 0 | 0 | ≥ 1 |
| Custom workflows | 0 | 1–5 | > 5 |
| Custom API endpoints | 0 | 1–10 | > 10 |
| Custom admin/vendor pages | 0 | 0–5 | > 5 or extensions |
| No-equivalent integrations | 0 | 0–1 (non-blocking) | ≥ 1 (may block) |

## Edge Cases

- **Custom storefront only, no backend changes**: Still **starter** for Mercur migration (storefront is out of scope)
- **Many workflows but all from registry blocks**: **Light custom** (block workflows are managed by the block)
- **Custom modules but < 5 workflows**: Still **heavy-custom** (modules are the complexity driver)
