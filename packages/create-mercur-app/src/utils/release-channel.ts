import path from "path";

import fs from "fs-extra";

export type ReleaseChannel = "latest" | "rc" | "canary";

const REGISTRY_URL = "https://registry.npmjs.org";

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

export function detectReleaseChannel(cliVersion: string): ReleaseChannel {
  if (cliVersion.includes("-canary")) {
    return "canary";
  }

  if (cliVersion.includes("-rc")) {
    return "rc";
  }

  return "latest";
}

async function resolveDistTag(
  packageName: string,
  channel: ReleaseChannel
): Promise<string | null> {
  try {
    const res = await fetch(
      `${REGISTRY_URL}/-/package/${packageName}/dist-tags`
    );

    if (!res.ok) {
      return null;
    }

    const tags = (await res.json()) as Record<string, string>;
    return tags[channel] ?? null;
  } catch {
    return null;
  }
}

async function collectPackageJsonPaths(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) {
        continue;
      }
      results.push(
        ...(await collectPackageJsonPaths(path.join(dir, entry.name)))
      );
    } else if (entry.name === "package.json") {
      results.push(path.join(dir, entry.name));
    }
  }

  return results;
}

function isMercurPackage(name: string): boolean {
  return name.startsWith("@mercurjs/") || name === "mercurjs";
}

// The templates are the production starting point, so they pin stable
// `@mercurjs/*` versions. When the user runs a pre-release of this CLI
// (`create-mercur-app@canary`), those pins are repointed at the matching
// dist-tag so the generated project matches the CLI that scaffolded it.
// Returns the version everything was pinned to, or null if that channel has
// no published release.
export async function applyReleaseChannel({
  projectDir,
  channel,
}: {
  projectDir: string;
  channel: ReleaseChannel;
}): Promise<string | null> {
  if (channel === "latest") {
    return null;
  }

  const packageJsonPaths = await collectPackageJsonPaths(projectDir);
  const resolved = new Map<string, string | null>();
  let pinnedVersion: string | null = null;

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = await fs.readJSON(packageJsonPath);
    let changed = false;

    for (const field of DEPENDENCY_FIELDS) {
      const deps = packageJson[field] as Record<string, string> | undefined;
      if (!deps) {
        continue;
      }

      for (const name of Object.keys(deps)) {
        if (!isMercurPackage(name)) {
          continue;
        }

        if (!resolved.has(name)) {
          resolved.set(name, await resolveDistTag(name, channel));
        }

        const version = resolved.get(name);
        if (!version) {
          continue;
        }

        pinnedVersion ??= version;

        if (deps[name] !== version) {
          deps[name] = version;
          changed = true;
        }
      }
    }

    if (changed) {
      await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
    }
  }

  return pinnedVersion;
}
