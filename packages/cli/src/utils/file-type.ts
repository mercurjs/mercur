import type z from "zod";
import type { RegistryItemCategory, registryItemFileSchema } from "../registry/schema";
import type { Config } from "../schema";
import path from "path";
/**
 * Get the target directory for a registry file based on its type.
 */
export function getTargetDir(file: {
  type: string;
  path: string;
}, config: Config) {
  if (file.type === "registry:workflow") return config.resolvedPaths.workflows;
  if (file.type === "registry:api") return config.resolvedPaths.api;
  if (file.type === "registry:link") return config.resolvedPaths.links;
  if (file.type === "registry:module") return config.resolvedPaths.modules;
  if (file.type === "registry:vendor") return config.resolvedPaths.vendor;
  if (file.type === "registry:admin") return config.resolvedPaths.admin;
  if (file.type === "registry:lib") return config.resolvedPaths.lib;
  throw new Error(`Unknown file type: ${file.type}`);
}




export function resolveFilePath(file: z.infer<typeof registryItemFileSchema>, config: Config, options: {
  isSrcDir: boolean;
  path: string
}) {
  // todo: add target support if path handling is not enough
  const targetDir = getTargetDir(file, config);

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

  // Find the last matching segment from targetDir in filePath
  const lastTargetSegment = targetSegments[targetSegments.length - 1]
  const commonDirIndex = fileSegments.findIndex(
    (segment) => segment === lastTargetSegment
  )

  if (commonDirIndex === -1) {
    // Return just the filename if no common directory is found
    return fileSegments[fileSegments.length - 1]
  }

  // Return everything after the common directory
  return fileSegments.slice(commonDirIndex + 1).join("/")
}