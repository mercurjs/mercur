import type { RegistryItemCategory } from "../registry/schema";

/**
 * Get the target directory for a registry file based on its type.
 */
export function getTargetDir(
  file: { type: string; path: string },
  fallback: RegistryItemCategory
): RegistryItemCategory {
  if (file.type === "registry:workflow") return "workflows";
  if (file.type === "registry:api") return "api";
  if (file.type === "registry:link") return "links";
  if (file.type === "registry:module") return "modules";
  if (file.type === "registry:vendor") return "vendorPages";
  if (file.type === "registry:admin") return "adminPages";
  if (file.type === "registry:lib") return "lib";
  return fallback;
}

/**
 * Get the relative path by stripping the type prefix from a file path.
 */
export function getRelativePath(filePath: string) {
  return filePath.replace(/^(agents|tools|prompts)\//, "");
}
