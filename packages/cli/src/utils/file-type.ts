import type z from "zod";
import type { registryItemFileSchema } from "../registry/schema";
import type { Config } from "../schema";
import path from "path";
/**
 * Get the target directory for a registry file based on its type.
 */
export function getTargetDir(file: {
  type: string;
  path: string;
}, config: Config) {
  if (file.type === "registry:api") return config.resolvedPaths.api;
  if (file.type === "registry:vendor") return config.resolvedPaths.vendor;
  if (file.type === "registry:admin") return config.resolvedPaths.admin;
  throw new Error(`Unknown file type: ${file.type}`);
}


export function resolveFilePath(file: z.infer<typeof registryItemFileSchema>, config: Config, options: {
  isSrcDir: boolean;
  path: string
}) {
  // todo: add target support if path handling is not enough
  const targetDir = getTargetDir(file, config);

  if (file.type === "registry:api") {
    // For api files, the path follows <block-name>/<rest> convention.
    // Strip the block name prefix and use the rest as the relative path.
    const segments = file.path.replace(/^\/|\/$/g, "").split("/");
    const relativePath = segments.slice(1).join("/");
    return path.join(targetDir, relativePath);
  }

  const relativePath = resolveNestedFilePath(file.path, targetDir);

  return path.join(targetDir, relativePath)
}


export function resolveNestedFilePath(
  filePath: string,
  targetDir: string
): string {
  // Normalize paths by removing leading/trailing slashes
  const normalizedFilePath = filePath.replace(/^\/|\/$/g, "")
  const normalizedTargetDir = targetDir.replace(/^\/|\/$/g, "")

  // Split paths into segments
  const fileSegments = normalizedFilePath.split("/")
  const targetSegments = normalizedTargetDir.split("/")

  // Search target segments from the end to find the first match in filePath
  for (let i = targetSegments.length - 1; i >= 0; i--) {
    const commonDirIndex = fileSegments.findIndex(
      (segment) => segment === targetSegments[i]
    )

    if (commonDirIndex !== -1) {
      // Return everything after the common directory
      return fileSegments.slice(commonDirIndex + 1).join("/")
    }
  }

  // Return just the filename if no common directory is found
  return fileSegments[fileSegments.length - 1]
}