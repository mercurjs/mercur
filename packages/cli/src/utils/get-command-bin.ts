import * as path from "path";
import { readFileSync } from "fs";
import { packageDirectory } from "pkg-dir";
import resolveCwd from "resolve-cwd";

export async function resolveBinAsync(pkg: string, executable = pkg) {
  const resolved = resolveCwd(pkg);
  const pkgDir = await packageDirectory({ cwd: resolved });

  if (!pkgDir) throw new Error(`Could not find package.json for '${pkg}'`);

  const { bin } = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf-8"));
  const binPath = typeof bin === "object" ? bin[executable] : bin;

  if (!binPath) throw new Error(`No bin '${executable}' in module '${pkg}'`);

  return path.join(pkgDir, binPath);
}

export async function getCommandBin(
  command: string,
  executable: string = command,
  rootFolder: string = process.cwd()
): Promise<string> {
  const bin = await resolveBinAsync(command, executable);
  return path.resolve(rootFolder, bin);
}
