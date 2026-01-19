import type { RegistryItemCategory } from "../registry/schema";

/**
 * Get the target directory for a registry file based on its type.
 */
export function getTargetDir(file: {
  type: string;
  path: string;
}): RegistryItemCategory {
  if (file.type === "registry:workflow") return "workflows";
  if (file.type === "registry:api") return "api";
  if (file.type === "registry:link") return "links";
  if (file.type === "registry:module") return "modules";
  if (file.type === "registry:vendor") return "vendor";
  if (file.type === "registry:admin") return "admin";
  if (file.type === "registry:lib") return "lib";
  throw new Error(`Unknown file type: ${file.type}`);
}

/**
 * Get the relative path by stripping the type prefix from a file path.
 */
export function getRelativePath(filePath: string) {
  return filePath.replace(
    /^(workflows|api|links|modules|vendor|admin|lib)\//,
    ""
  );
}

/**
 * Resolve nested file path by finding the common root between file path and target directory.
 */
export function resolveNestedFilePath(filePath: string, targetDir: string) {
  const fileName = filePath.split("/").pop() || filePath;

  // Get path segments
  const fileSegments = filePath.split("/").slice(0, -1); // Remove filename
  const targetSegments = targetDir.split("/");

  // Find common segments from the end of targetDir matching start of filePath
  let commonLength = 0;
  for (let i = 0; i < fileSegments.length && i < targetSegments.length; i++) {
    const targetEnd = targetSegments.slice(-(i + 1)).join("/");
    const fileStart = fileSegments.slice(0, i + 1).join("/");
    if (targetEnd === fileStart) {
      commonLength = i + 1;
    }
  }

  // Build relative path from non-common segments
  const relativeParts = fileSegments.slice(commonLength);
  return [...relativeParts, fileName].join("/");
}
