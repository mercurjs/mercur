export type StarterPolicy = "sync" | "manual" | "exclude";
export type SyncMode = "copy" | "adapt";

export interface TemplateBasicRule {
  id: string;
  description: string;
  sourcePaths: string[];
  targetPaths: string[];
  starterPolicy: Exclude<StarterPolicy, "exclude">;
  mode: SyncMode;
  reviewMessage: string;
}

export interface CanonicalSkillPolicy {
  starterPolicy: StarterPolicy;
  reason: string;
  targetPaths: string[];
}

export const templateBasicRules: TemplateBasicRule[] = [
  {
    id: "shared-governance",
    description: "Root agent workflow guidance that shapes how the starter explains agent operations.",
    sourcePaths: [
      "AGENTS.md",
      ".ai/skills/README.md",
      "templates/ai-governance/AGENTS.md",
      "templates/ai-governance/.ai/skills/README.md",
    ],
    targetPaths: [
      "templates/basic/AGENTS.md",
      "templates/basic/.ai/skills/README.md",
    ],
    starterPolicy: "sync",
    mode: "adapt",
    reviewMessage:
      "Starter root guidance or starter skill index may need updating.",
  },
  {
    id: "mercur-cli-knowledge",
    description: "CLI behavior and command selection guidance relevant to starter users.",
    sourcePaths: [
      ".ai/skills/mercur-cli/",
      "packages/cli/README.md",
      "packages/cli/src/commands/create.ts",
      "packages/cli/src/commands/init.ts",
      "packages/cli/src/commands/add.ts",
      "packages/cli/src/commands/search.ts",
      "packages/cli/src/commands/view.ts",
      "packages/cli/src/commands/diff.ts",
    ],
    targetPaths: [
      "templates/basic/AGENTS.md",
      "templates/basic/packages/api/AGENTS.md",
      "templates/basic/.ai/skills/mercur-cli/",
      "templates/basic/.claude/skills/mercur-cli/",
      "templates/basic/.codex/skills/mercur-cli/",
    ],
    starterPolicy: "sync",
    mode: "copy",
    reviewMessage:
      "Starter CLI skill or starter guides may be stale relative to current CLI behavior.",
  },
  {
    id: "mercur-blocks-workflow",
    description: "Block discovery, install, alias, and post-install verification knowledge.",
    sourcePaths: [
      ".ai/skills/mercur-blocks/",
      "packages/cli/README.md",
      "packages/cli/src/registry/",
      "packages/cli/src/commands/add.ts",
      "packages/cli/src/commands/search.ts",
      "packages/cli/src/commands/view.ts",
      "packages/cli/src/commands/diff.ts",
      "templates/basic/blocks.json",
    ],
    targetPaths: [
      "templates/basic/AGENTS.md",
      "templates/basic/packages/api/AGENTS.md",
      "templates/basic/.ai/skills/mercur-blocks/",
      "templates/basic/.claude/skills/mercur-blocks/",
      "templates/basic/.codex/skills/mercur-blocks/",
    ],
    starterPolicy: "sync",
    mode: "adapt",
    reviewMessage:
      "Starter block workflow docs may need an update because aliasing or registry behavior changed.",
  },
  {
    id: "admin-ui-skills",
    description: "Starter-safe admin page, form, and tab skills.",
    sourcePaths: [
      ".ai/skills/medusa-ui-conformance/",
      ".ai/skills/admin-page-ui/",
      ".ai/skills/admin-form-ui/",
      ".ai/skills/admin-tab-ui/",
    ],
    targetPaths: [
      "templates/basic/.ai/skills/medusa-ui-conformance/",
      "templates/basic/.ai/skills/admin-page-ui/",
      "templates/basic/.ai/skills/admin-form-ui/",
      "templates/basic/.ai/skills/admin-tab-ui/",
      "templates/basic/.claude/skills/medusa-ui-conformance/",
      "templates/basic/.claude/skills/admin-page-ui/",
      "templates/basic/.claude/skills/admin-form-ui/",
      "templates/basic/.claude/skills/admin-tab-ui/",
      "templates/basic/.codex/skills/medusa-ui-conformance/",
      "templates/basic/.codex/skills/admin-page-ui/",
      "templates/basic/.codex/skills/admin-form-ui/",
      "templates/basic/.codex/skills/admin-tab-ui/",
    ],
    starterPolicy: "sync",
    mode: "adapt",
    reviewMessage:
      "Starter admin UI skills may be stale relative to the canonical admin UI skills.",
  },
  {
    id: "api-extension-knowledge",
    description: "How the starter backend should explain routes, modules, workflows, links, and codegen.",
    sourcePaths: [
      "packages/core-plugin/AGENTS.md",
      "packages/core-plugin/src/api/README.md",
      "packages/core-plugin/src/modules/README.md",
      "packages/types/AGENTS.md",
      "packages/core-plugin/package.json",
    ],
    targetPaths: [
      "templates/basic/AGENTS.md",
      "templates/basic/packages/api/AGENTS.md",
    ],
    starterPolicy: "sync",
    mode: "adapt",
    reviewMessage:
      "Starter API workspace guide may need updating after backend guidance or codegen behavior changed.",
  },
  {
    id: "admin-extension-knowledge",
    description: "How the starter should explain admin custom pages and extension points.",
    sourcePaths: [
      "packages/admin/AGENTS.md",
      "templates/basic/apps/admin/src/README.md",
    ],
    targetPaths: [
      "templates/basic/apps/admin/AGENTS.md",
    ],
    starterPolicy: "sync",
    mode: "adapt",
    reviewMessage:
      "Starter admin guide may need updating after admin extension conventions changed.",
  },
  {
    id: "vendor-extension-knowledge",
    description: "How the starter should explain vendor custom pages and extension points.",
    sourcePaths: [
      "packages/vendor/AGENTS.md",
    ],
    targetPaths: [
      "templates/basic/apps/vendor/AGENTS.md",
    ],
    starterPolicy: "sync",
    mode: "adapt",
    reviewMessage:
      "Starter vendor guide may need updating after vendor extension conventions changed.",
  },
];

export const canonicalSkillPolicies: Record<string, CanonicalSkillPolicy> = {
  "mercur-cli": {
    starterPolicy: "sync",
    reason: "Core starter workflow skill for CLI command choice and workdir selection.",
    targetPaths: [
      "templates/basic/.ai/skills/mercur-cli/",
      "templates/basic/.claude/skills/mercur-cli/",
      "templates/basic/.codex/skills/mercur-cli/",
    ],
  },
  "mercur-blocks": {
    starterPolicy: "sync",
    reason: "Core starter workflow skill for block discovery, install impact, and verification.",
    targetPaths: [
      "templates/basic/.ai/skills/mercur-blocks/",
      "templates/basic/.claude/skills/mercur-blocks/",
      "templates/basic/.codex/skills/mercur-blocks/",
    ],
  },
  "medusa-ui-conformance": {
    starterPolicy: "sync",
    reason: "Starter should guide custom dashboard UI toward local wrappers and Medusa UI before lower-level primitives.",
    targetPaths: [
      "templates/basic/.ai/skills/medusa-ui-conformance/",
      "templates/basic/.claude/skills/medusa-ui-conformance/",
      "templates/basic/.codex/skills/medusa-ui-conformance/",
    ],
  },
  "admin-page-ui": {
    starterPolicy: "sync",
    reason: "Starter ships admin page extension knowledge from day one.",
    targetPaths: [
      "templates/basic/.ai/skills/admin-page-ui/",
      "templates/basic/.claude/skills/admin-page-ui/",
      "templates/basic/.codex/skills/admin-page-ui/",
    ],
  },
  "admin-form-ui": {
    starterPolicy: "sync",
    reason: "Starter ships admin form conventions from day one.",
    targetPaths: [
      "templates/basic/.ai/skills/admin-form-ui/",
      "templates/basic/.claude/skills/admin-form-ui/",
      "templates/basic/.codex/skills/admin-form-ui/",
    ],
  },
  "admin-tab-ui": {
    starterPolicy: "sync",
    reason: "Starter ships tabbed admin flow conventions from day one.",
    targetPaths: [
      "templates/basic/.ai/skills/admin-tab-ui/",
      "templates/basic/.claude/skills/admin-tab-ui/",
      "templates/basic/.codex/skills/admin-tab-ui/",
    ],
  },
  "compound-components-migration-review": {
    starterPolicy: "exclude",
    reason: "Migration and review skill for the main repo, not day-one starter knowledge.",
    targetPaths: [],
  },
  "cc-alignment": {
    starterPolicy: "exclude",
    reason: "Repo-specific alignment workflow, not a starter-level task.",
    targetPaths: [],
  },
  "admin-ui-review": {
    starterPolicy: "exclude",
    reason: "Review-specific skill; starter focuses on implementation workflows.",
    targetPaths: [],
  },
};
