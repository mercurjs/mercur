import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_DEV_PORT } from "../src/identity";
import {
  resolveStorefrontUrl,
  type ShellTarget,
} from "../src/resolve-url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(ROOT, "..", "..");
const STOREFRONT = join(REPO_ROOT, "apps", "storefront");

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function parseTarget(): ShellTarget {
  const raw = argValue("--target") ?? "desktop";

  switch (raw) {
    case "web":
    case "desktop":
    case "ios-simulator":
    case "android-emulator":
    case "device":
      return raw;
    case "ios":
      return "ios-simulator";
    case "android":
      return "android-emulator";
    case "macos":
    case "windows":
    case "linux":
      return "desktop";
    default:
      throw new Error(
        `Unknown target "${raw}". Use web, macos, windows, linux, ios, android, or device.`
      );
  }
}

function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createServer();

    socket.once("error", () => resolve(true));
    socket.once("listening", () => {
      socket.close(() => resolve(false));
    });
    socket.listen(port, "127.0.0.1");
  });
}

function run(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function ensureStorefront(url: string): Promise<boolean> {
  if (await portInUse(DEFAULT_DEV_PORT)) {
    process.stdout.write(`Storefront already running (port ${DEFAULT_DEV_PORT})\n`);
    process.stdout.write(`Native shells will load ${url}\n`);
    return false;
  }

  process.stdout.write(`Starting storefront for ${url}\n`);
  spawn("bun", ["run", "dev"], {
    cwd: STOREFRONT,
    env: process.env,
    stdio: "inherit",
    detached: false,
  });

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await portInUse(DEFAULT_DEV_PORT)) {
      return true;
    }

    await Bun.sleep(500);
  }

  throw new Error(`Storefront did not start on port ${DEFAULT_DEV_PORT}`);
}

async function ensureCapacitorPlatform(platform: "ios" | "android"): Promise<void> {
  if (existsSync(join(ROOT, platform))) {
    return;
  }

  process.stdout.write(`Adding Capacitor ${platform} platform (first run)…\n`);
  const code = await run("bunx", ["cap", "add", platform], ROOT, process.env);

  if (code !== 0) {
    throw new Error(
      `Failed to add ${platform}. Install Xcode (iOS) or Android Studio (Android) and retry.`
    );
  }
}

async function main(): Promise<void> {
  const target = parseTarget();
  const url = resolveStorefrontUrl(target);
  const env = {
    ...process.env,
    STOREFRONT_URL: url,
    CAP_TARGET: target,
  };

  process.stdout.write(`\nMercur storefront → ${target}\n  ${url}\n\n`);

  let startedStorefront = false;

  if (!hasFlag("--skip-web")) {
    startedStorefront = await ensureStorefront(url);
  }

  if (target === "web") {
    process.stdout.write("Open the URL above in Safari, Chrome, or Firefox.\n");
    process.stdout.write("iOS/Android: use device mode in DevTools, then Add to Home Screen.\n");

    if (startedStorefront) {
      await new Promise<never>(() => undefined);
    }

    return;
  }

  if (target === "desktop") {
    const compile = await run(
      "bun",
      [
        "build",
        "desktop/main.ts",
        "desktop/preload.ts",
        "--outdir",
        ".electron",
        "--target",
        "node",
        "--format",
        "cjs",
        "--external",
        "electron",
      ],
      ROOT,
      env
    );

    if (compile !== 0) {
      process.exit(compile);
    }

    process.exit(await run("bunx", ["electron", "."], ROOT, env));
  }

  const platform: "ios" | "android" =
    target === "android-emulator" || process.env.CAP_PLATFORM === "android"
      ? "android"
      : "ios";
  await ensureCapacitorPlatform(platform);
  const sync = await run("bunx", ["cap", "sync", platform], ROOT, env);

  if (sync !== 0) {
    process.exit(sync);
  }

  process.exit(await run("bunx", ["cap", "run", platform], ROOT, env));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
