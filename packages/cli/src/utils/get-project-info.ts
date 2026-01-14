import fs from "fs-extra";
import path from "path";
import { loadConfig } from "tsconfig-paths";

export type ProjectInfo = {
  isSrcDir: boolean;
  aliasPrefix: string | null;
};

export async function getProjectInfo(cwd: string): Promise<ProjectInfo | null> {
  const [isSrcDir, aliasPrefix] = await Promise.all([
    fs.pathExists(path.resolve(cwd, "src")),
    getTsConfigAliasPrefix(cwd),
  ]);

  return {
    isSrcDir,
    aliasPrefix,
  };
}

export async function getTsConfigAliasPrefix(cwd: string) {
  const tsConfig = loadConfig(cwd);

  if (tsConfig.resultType === "failed") {
    return null;
  }

  const paths = tsConfig.paths || {};
  const pathKeys = Object.keys(paths);

  if (pathKeys.length === 0) {
    return null;
  }

  const firstPath = pathKeys[0];
  if (firstPath?.includes("*")) {
    return firstPath.replace("/*", "");
  }

  return firstPath?.replace("/", "") ?? null;
}
