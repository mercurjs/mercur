import { detect } from "@antfu/ni";

export async function getPackageManager(
  targetDir: string,
): Promise<"yarn" | "pnpm" | "bun" | "npm" | "deno"> {
  const packageManager = await detect({ programmatic: true, cwd: targetDir });

  if (packageManager?.startsWith("bun")) return "bun";
  if (packageManager?.startsWith("yarn")) return "yarn";
  if (packageManager?.startsWith("pnpm")) return "pnpm";
  if (packageManager?.startsWith("deno")) return "deno";
  if (packageManager?.startsWith("npm")) return "npm";

  const userAgent = process.env.npm_config_user_agent || "";

  if (userAgent.startsWith("bun")) return "bun";
  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("deno")) return "deno";

  return "npm";
}

export async function getPackageRunner(cwd: string) {
  const packageManager = await getPackageManager(cwd);

  if (packageManager === "pnpm") return "pnpm dlx";

  if (packageManager === "bun") return "bunx";

  return "npx";
}
