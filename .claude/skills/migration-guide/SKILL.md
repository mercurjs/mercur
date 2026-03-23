---
name: migration-guide
description: Plan and execute migration from Mercur 1.x to 2.0. Classifies project difficulty, reads relevant migration docs, and follows stop conditions.
argument-hint: "[path-to-old-project]"
---

# Migration Guide Workflow

Use this skill when:
- Planning a migration from Mercur 1.x to 2.0
- Executing migration steps for a specific project
- Evaluating migration feasibility or effort

## Read first

Before any action, read:
1. `docs/migrations/mercur-1.x-to-2.0/README.md` — entry point, version check, package/directory mapping, approach

## Workflow

### Step 1: Classify the project

Read `references/decision-tree.md` in this skill directory, then:

1. Inventory the source project:
   - Read `package.json` — note `@mercurjs/b2c-core` version to determine 1.x version
   - If version < 1.4.0: custom admin code is inside the backend repo (not `apps/admin/`) — search there when scanning for custom dashboard pages
   - Count custom modules, workflows, API routes, subscribers, links
   - Identify third-party integrations
   - Note custom admin/vendor pages
2. Classify as: **starter**, **light-custom**, or **heavy-custom**
3. Communicate the classification and its implications to the user

### Step 2: Read relevant migration docs

Based on classification, read from `docs/migrations/mercur-1.x-to-2.0/`:

| Document | Starter | Light Custom | Heavy Custom |
|----------|---------|-------------|-------------|
| README.md | Required | Required | Required |
| dashboards.md | Skim | Required | Required |

### Step 3: Execute migration

1. Set up fresh 2.0 project (see README.md)
2. Update `medusa-config.ts` (plugins, modules, providers)
3. Add registry blocks (`mercurjs add <block>`)
4. Port custom backend code in order: providers → modules → workflows → links → subscribers → API routes → middlewares
5. Port dashboard code (if applicable)
6. Verify at each checkpoint

### Step 4: Verify completion

- Server starts without errors
- All custom endpoints respond
- Dashboard builds without errors
- Custom pages render in browser

## Stop conditions

Stop and ask the user when:
- A custom module depends on internal APIs not exposed in `@mercurjs/core-plugin`
- A third-party integration (Resend, Stripe Connect, Stripe Tax) is a launch blocker and has no 2.0 equivalent
- Database schema conflicts cannot be resolved with standard migrations
- The project uses MedusaJS core modifications
- You cannot classify the project's difficulty level
- A verification checkpoint fails with an unclear root cause

## Avoid

- Do not attempt in-place upgrades of 1.x projects
- Do not install 1.x packages in a 2.0 project
- Do not skip verification checkpoints
- Do not reference or depend on `.migration/` or any private test directories
