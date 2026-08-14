import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(command: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

const compile = await run("bun", [
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
]);

if (compile !== 0) {
  process.exit(compile);
}

const extraArgs = process.argv.slice(2);
process.exit(await run("bunx", ["electron-builder", "--config", "electron-builder.yml", "--publish", "never", ...extraArgs]));
