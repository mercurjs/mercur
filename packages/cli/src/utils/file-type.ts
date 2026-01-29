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
  const targetDir = getTargetDir(file, config);

  // If target is specified, use it directly (relative to the base target directory)
  if (file.target) {
    // Extract the type prefix (e.g., "admin" from "admin/routes/...")
    const targetSegments = file.target.split("/");
    const typePrefix = targetSegments[0];

    // Check if the target starts with a known type prefix that matches the file type
    const typeMap: Record<string, string> = {
      "registry:admin": "admin",
      "registry:vendor": "vendor",
      "registry:module": "modules",
      "registry:api": "api",
      "registry:workflow": "workflows",
      "registry:link": "links",
      "registry:lib": "lib",
    };

    const expectedPrefix = typeMap[file.type];
    if (expectedPrefix && typePrefix === expectedPrefix) {
      // Remove the type prefix from target and join with targetDir
      const relativePath = targetSegments.slice(1).join("/");
      return path.join(targetDir, relativePath);
    }

    // Otherwise use the full target path relative to targetDir
    return path.join(targetDir, file.target);
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