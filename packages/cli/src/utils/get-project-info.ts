import fs from "fs-extra";
import path from "path";
import ts, { type CompilerOptions } from "typescript";
import { loadConfig } from "tsconfig-paths";
import fg from "fast-glob"

export interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
}

export type ProjectInfo = {
  isSrcDir: boolean;
  aliasPrefix: string | null;
  packageJson: PackageJson | null;
  medusaConfigFile: string | null;
  medusaVersion: string | null;
  mercurVersion: string | null;
};

const PROJECT_SHARED_IGNORE = [
  "**/node_modules/**",
  "public",
  "dist",
]

export async function getProjectInfo(cwd: string): Promise<ProjectInfo> {
  const [isSrcDir, aliasPrefix, packageJson, medusaConfigInfo, medusaVersion, mercurVersion] = await Promise.all([
    fs.pathExists(path.resolve(cwd, "src")),
    getTsConfigAliasPrefix(cwd),
    getPackageInfo(cwd),
    getMedusaConfigFile(cwd),
    getMedusaVersion(cwd),
    getMercurVersion(cwd),
  ]);

  return {
    isSrcDir,
    aliasPrefix,
    packageJson,
    medusaConfigFile: medusaConfigInfo?.file ?? null,
    medusaVersion,
    mercurVersion,
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

export function getPackageInfo(
  cwd: string = "",
  shouldThrow: boolean = true
): PackageJson | null {
  const packageJsonPath = path.join(cwd, "package.json")

  return fs.readJSONSync(packageJsonPath, {
    throws: shouldThrow,
  }) as PackageJson
}

export async function getMedusaConfigFile(cwd: string): Promise<{ file: string; dir: string } | null> {
  const files = await fg.glob("medusa-config.*", {
    cwd,
    deep: 3,
    ignore: PROJECT_SHARED_IGNORE,
  })

  if (!files.length) {
    return null
  }

  const file = files[0]
  return {
    file,
    dir: path.resolve(cwd, path.dirname(file)),
  }
}

export async function getMedusaVersion(cwd: string): Promise<string | null> {
  const packageJson = getPackageInfo(cwd, false)

  const rootVersion = packageJson?.dependencies?.['@medusajs/framework']
  if (rootVersion) {
    return rootVersion
  }

  const packageJsonFiles = await fg.glob("**/package.json", {
    cwd,
    deep: 3,
    ignore: PROJECT_SHARED_IGNORE,
  })

  for (const file of packageJsonFiles) {
    const pkgJson = getPackageInfo(path.join(cwd, path.dirname(file)), false)
    const version = pkgJson?.dependencies?.['@medusajs/framework']
    if (version) {
      return version
    }
  }

  return null
}

export async function getMercurVersion(cwd: string): Promise<string | null> {
  const packageJson = getPackageInfo(cwd, false)

  const rootVersion = packageJson?.dependencies?.['@mercurjs/cli']
  if (rootVersion) {
    return rootVersion
  }

  const packageJsonFiles = await fg.glob("**/package.json", {
    cwd,
    deep: 3,
    ignore: PROJECT_SHARED_IGNORE,
  })

  for (const file of packageJsonFiles) {
    const pkgJson = getPackageInfo(path.join(cwd, path.dirname(file)), false)
    const version = pkgJson?.dependencies?.['@mercurjs/cli']
    if (version) {
      return version
    }
  }

  return null
}