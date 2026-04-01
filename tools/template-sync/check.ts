import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { canonicalSkillPolicies, templateBasicRules } from "./config";

type WarningRecord = {
  title: string;
  body: string;
};

function runGit(args: string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function tryGit(args: string[]): string | null {
  try {
    return runGit(args);
  } catch {
    return null;
  }
}

function parseBaseArg(argv: string[]): string | null {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === "--base" || arg === "-b") && argv[i + 1]) {
      return argv[i + 1];
    }
  }
  return null;
}

function refExists(ref: string): boolean {
  return tryGit(["rev-parse", "--verify", `${ref}^{commit}`]) !== null;
}

function resolveBaseRef(argv: string[]): string {
  const candidates = [
    parseBaseArg(argv),
    process.env.TEMPLATE_SYNC_BASE || null,
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null,
    process.env.GITHUB_BASE_REF || null,
    "origin/new",
    "new",
    "HEAD~1",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (refExists(candidate)) {
      return candidate;
    }
  }

  return "HEAD~1";
}

function listChangedFiles(baseRef: string): string[] {
  const diff =
    tryGit(["diff", "--name-only", `${baseRef}...HEAD`]) ??
    tryGit(["diff", "--name-only", baseRef, "HEAD"]) ??
    "";

  return diff
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function matchesWatchedPath(filePath: string, watchedPath: string): boolean {
  if (watchedPath.endsWith("/")) {
    return filePath === watchedPath.slice(0, -1) || filePath.startsWith(watchedPath);
  }

  return filePath === watchedPath;
}

function anyChangedInPaths(changedFiles: string[], watchedPaths: string[]): boolean {
  return changedFiles.some((filePath) =>
    watchedPaths.some((watchedPath) => matchesWatchedPath(filePath, watchedPath))
  );
}

function changedPathsForRule(changedFiles: string[], watchedPaths: string[]): string[] {
  return watchedPaths.filter((watchedPath) =>
    changedFiles.some((filePath) => matchesWatchedPath(filePath, watchedPath))
  );
}

function listCanonicalSkills(): string[] {
  const skillsDir = path.resolve(process.cwd(), ".ai/skills");
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(skillsDir, name, "SKILL.md")))
    .sort();
}

function writeSummary(markdown: string): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }

  fs.appendFileSync(summaryPath, `${markdown}\n`);
}

const baseRef = resolveBaseRef(process.argv.slice(2));
const changedFiles = listChangedFiles(baseRef);
const warnings: WarningRecord[] = [];

const touchedRules = templateBasicRules
  .map((rule) => {
    const sourceTouched = anyChangedInPaths(changedFiles, rule.sourcePaths);
    const changedTargets = changedPathsForRule(changedFiles, rule.targetPaths);
    const unchangedTargets = rule.targetPaths.filter(
      (targetPath) => !changedTargets.includes(targetPath)
    );

    if (sourceTouched && unchangedTargets.length > 0) {
      warnings.push({
        title: `starter drift risk: ${rule.id}`,
        body: `${rule.reviewMessage}\nUnchanged starter targets:\n- ${unchangedTargets.join("\n- ")}`,
      });
    }

    return {
      ...rule,
      sourceTouched,
      changedTargets,
      unchangedTargets,
    };
  })
  .filter((rule) => rule.sourceTouched);

const canonicalSkills = listCanonicalSkills();
const unclassifiedSkills = canonicalSkills.filter(
  (skillName) => !(skillName in canonicalSkillPolicies)
);

if (unclassifiedSkills.length > 0) {
  warnings.push({
    title: "unclassified canonical skills",
    body: `Add starter relevance entries for:\n- ${unclassifiedSkills.join("\n- ")}`,
  });
}

const markdownLines: string[] = [
  "## Template/basic sync check",
  "",
  `- Base ref: \`${baseRef}\``,
  `- Changed files: ${changedFiles.length}`,
  `- Starter-relevant groups touched: ${touchedRules.length}`,
  "",
];

if (touchedRules.length === 0) {
  markdownLines.push("No starter-relevant source changes detected.");
} else {
  markdownLines.push("### Touched rule groups", "");
  for (const rule of touchedRules) {
    markdownLines.push(
      `- \`${rule.id}\` (${rule.mode}, ${rule.starterPolicy}) — ${rule.description}`
    );
  }
}

markdownLines.push("", "### Canonical skill classification", "");
markdownLines.push(
  `- Canonical skills discovered: ${canonicalSkills.length}`,
  `- Unclassified canonical skills: ${unclassifiedSkills.length}`
);

if (warnings.length > 0) {
  markdownLines.push("", "### Warnings", "");
  for (const warning of warnings) {
    markdownLines.push(`- **${warning.title}**`);
    for (const line of warning.body.split("\n")) {
      markdownLines.push(`  ${line}`);
    }
  }
} else {
  markdownLines.push("", "No starter drift warnings detected.");
}

const markdown = `${markdownLines.join("\n")}\n`;
process.stdout.write(markdown);
writeSummary(markdown);

if (warnings.length > 0) {
  const warningTitle = "Template Basic Sync";
  const warningBody = `${warnings.length} starter drift warning(s) detected. See job summary for details.`;
  process.stdout.write(`::warning title=${warningTitle}::${warningBody}\n`);
}
