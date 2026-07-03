import { detect } from "@antfu/ni";
import { execa } from "execa";

export type PackageManager = "yarn" | "pnpm" | "bun" | "npm" | "deno";

const SUPPORTED_PACKAGE_MANAGERS: PackageManager[] = [
  "bun",
  "yarn",
  "pnpm",
  "deno",
  "npm",
];

function normalizePackageManager(
  value: string | null | undefined,
): PackageManager | undefined {
  if (!value) return undefined;
  return SUPPORTED_PACKAGE_MANAGERS.find((pm) => value.startsWith(pm));
}

/**
 * Detect the package manager that invoked the CLI from `npm_config_user_agent`.
 * This is the most reliable signal for what the user actually has and intends
 * to use (e.g. `npx`, `bunx`, `pnpm dlx`, `yarn dlx`).
 */
export function getPackageManagerFromUserAgent(): PackageManager | undefined {
  return normalizePackageManager(process.env.npm_config_user_agent);
}

/**
 * Check whether a package manager is actually installed and runnable, so we
 * never hand back a manager that would crash with `spawn <pm> ENOENT`.
 */
export async function isPackageManagerInstalled(
  packageManager: PackageManager,
): Promise<boolean> {
  try {
    await execa(packageManager, ["--version"]);
    return true;
  } catch {
    return false;
  }
}

export async function getPackageManager(
  targetDir: string,
): Promise<PackageManager> {
  const detected = normalizePackageManager(
    await detect({ programmatic: true, cwd: targetDir }),
  );

  // Respect the project's declared/lockfile package manager, but only if it is
  // actually installed — otherwise commands like `<pm> --version` blow up.
  if (detected && (await isPackageManagerInstalled(detected))) {
    return detected;
  }

  const fromUserAgent = getPackageManagerFromUserAgent();
  if (fromUserAgent && (await isPackageManagerInstalled(fromUserAgent))) {
    return fromUserAgent;
  }

  return "npm";
}

/**
 * Resolve the package manager to use for a brand-new project.
 *
 * Mirrors how the Medusa CLI picks a package manager: detect what the user
 * invoked the CLI with (`npm_config_user_agent`), verify it is actually
 * installed, and fall back to npm otherwise. The downloaded template's own
 * `packageManager` field (e.g. `yarn@4.6.0`) is intentionally ignored — it
 * reflects the template author's tooling, not the user's environment, and was
 * the cause of `spawn yarn ENOENT` crashes for users without yarn installed.
 */
export async function resolveProjectPackageManager(): Promise<PackageManager> {
  const fromUserAgent = getPackageManagerFromUserAgent();
  if (fromUserAgent && (await isPackageManagerInstalled(fromUserAgent))) {
    return fromUserAgent;
  }

  return "npm";
}

export async function getPackageRunner(cwd: string) {
  const packageManager = await getPackageManager(cwd);

  if (packageManager === "pnpm") return "pnpm dlx";

  if (packageManager === "bun") return "bunx";

  return "npx";
}
