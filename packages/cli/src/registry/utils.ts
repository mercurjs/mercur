import * as fs from "fs/promises";
import { tmpdir } from "os";
import * as path from "path";
import {
  registryItemFileSchema,
  registryItemSchema,
  registryItemTypeSchema,
} from "@/src/registry/schema";
import { configSchema, type Config } from "@/src/schema";
import { type ProjectInfo } from "@/src/utils/get-project-info";
import { resolveImport } from "@/src/utils/resolve-import";
import { Project, ScriptKind } from "ts-morph";
import { loadConfig } from "tsconfig-paths";
import { z } from "zod";

const FILE_EXTENSIONS_FOR_LOOKUP = [".tsx", ".ts"];
const FILE_PATH_SKIP_LIST = ["lib/utils.ts"];
const DEPENDENCY_SKIP_LIST = [
  /^(react|react-dom)(\/.*)?$/, // Matches react, react-dom and their submodules
  /^(node|jsr|npm):.*$/, // Matches node:, jsr:, and npm: prefixed modules
];

const project = new Project({
  compilerOptions: {},
});

// This returns the dependency from the module specifier.
// Here dependency means an npm package.
export function getDependencyFromModuleSpecifier(
  moduleSpecifier: string
): string | null {
  // Skip if the dependency matches any pattern in the skip list
  if (DEPENDENCY_SKIP_LIST.some((pattern) => pattern.test(moduleSpecifier))) {
    return null;
  }

  // If the module specifier does not start with `@` and has a /, add the dependency first part only.
  // E.g. `foo/bar` -> `foo`
  if (!moduleSpecifier.startsWith("@") && moduleSpecifier.includes("/")) {
    moduleSpecifier = moduleSpecifier.split("/")[0];
  }

  // For scoped packages, we want to keep the first two parts
  // E.g. `@types/react/dom` -> `@types/react`
  if (moduleSpecifier.startsWith("@")) {
    const parts = moduleSpecifier.split("/");
    if (parts.length > 2) {
      moduleSpecifier = parts.slice(0, 2).join("/");
    }
  }

  return moduleSpecifier;
}

export async function recursivelyResolveFileImports(
  filePath: string,
  config: z.infer<typeof configSchema>,
  projectInfo: ProjectInfo,
  processedFiles: Set<string> = new Set()
): Promise<Pick<z.infer<typeof registryItemSchema>, "files" | "dependencies">> {
  const resolvedFilePath = path.resolve(config.resolvedPaths.cwd, filePath);
  const relativeRegistryFilePath = path.relative(
    config.resolvedPaths.cwd,
    resolvedFilePath
  );

  // Skip if the file is in the skip list
  if (FILE_PATH_SKIP_LIST.includes(relativeRegistryFilePath)) {
    return { dependencies: [], files: [] };
  }

  // Skip if the file extension is not one of the supported extensions
  const fileExtension = path.extname(filePath);
  if (!FILE_EXTENSIONS_FOR_LOOKUP.includes(fileExtension)) {
    return { dependencies: [], files: [] };
  }

  // Prevent infinite loop: skip if already processed
  if (processedFiles.has(relativeRegistryFilePath)) {
    return { dependencies: [], files: [] };
  }
  processedFiles.add(relativeRegistryFilePath);

  try {
    const stat = await fs.stat(resolvedFilePath);
    if (!stat.isFile()) {
      return { dependencies: [], files: [] };
    }
  } catch {
    return { dependencies: [], files: [] };
  }

  const content = await fs.readFile(resolvedFilePath, "utf-8");
  const tempFile = await createTempSourceFile(path.basename(resolvedFilePath));
  const sourceFile = project.createSourceFile(tempFile, content, {
    scriptKind: ScriptKind.TSX,
  });
  const tsConfig = await loadConfig(config.resolvedPaths.cwd);
  if (tsConfig.resultType === "failed") {
    return { dependencies: [], files: [] };
  }

  const files: z.infer<typeof registryItemSchema>["files"] = [];
  const dependencies = new Set<string>();

  // Add the original file first
  const fileType = determineFileType(filePath);
  const originalFile = {
    path: relativeRegistryFilePath,
    type: fileType,
    target: "",
    content: "",
  };
  files.push(originalFile);

  // 1. Find all import statements in the file.
  const importStatements = sourceFile.getImportDeclarations();
  for (const importStatement of importStatements) {
    const moduleSpecifier = importStatement.getModuleSpecifierValue();

    const isRelativeImport = moduleSpecifier.startsWith(".");
    const isAliasImport =
      projectInfo.aliasPrefix &&
      moduleSpecifier.startsWith(`${projectInfo.aliasPrefix}/`);

    // If not a local import, add to the dependencies array.
    if (!isAliasImport && !isRelativeImport) {
      const dependency = getDependencyFromModuleSpecifier(moduleSpecifier);
      if (dependency) {
        dependencies.add(dependency);
      }
      continue;
    }

    let probableImportFilePath = await resolveImport(moduleSpecifier, tsConfig);

    if (isRelativeImport) {
      probableImportFilePath = path.resolve(
        path.dirname(resolvedFilePath),
        moduleSpecifier
      );
    }

    if (!probableImportFilePath) {
      continue;
    }

    // Check if the probable import path has a file extension.
    // Try each extension until we find a file that exists.
    const hasExtension = path.extname(probableImportFilePath);
    if (!hasExtension) {
      for (const ext of FILE_EXTENSIONS_FOR_LOOKUP) {
        const pathWithExt: string = `${probableImportFilePath}${ext}`;
        try {
          await fs.access(pathWithExt);
          probableImportFilePath = pathWithExt;
          break;
        } catch {
          continue;
        }
      }
    }

    const nestedRelativeRegistryFilePath = path.relative(
      config.resolvedPaths.cwd,
      probableImportFilePath
    );

    // Skip if we've already processed this file or if it's in the skip list
    if (
      processedFiles.has(nestedRelativeRegistryFilePath) ||
      FILE_PATH_SKIP_LIST.includes(nestedRelativeRegistryFilePath)
    ) {
      continue;
    }

    const nestedFileType = determineFileType(moduleSpecifier);
    const file = {
      path: nestedRelativeRegistryFilePath,
      type: nestedFileType,
      target: "",
      content: "",
    };

    files.push(file);

    // Recursively process the imported file, passing the shared processedFiles set
    const nestedResults = await recursivelyResolveFileImports(
      nestedRelativeRegistryFilePath,
      config,
      projectInfo,
      processedFiles
    );

    if (nestedResults.files) {
      // Only add files that haven't been processed yet
      for (const nestedFile of nestedResults.files) {
        if (!processedFiles.has(nestedFile.path)) {
          processedFiles.add(nestedFile.path);
          files.push(nestedFile);
        }
      }
    }

    if (nestedResults.dependencies) {
      nestedResults.dependencies.forEach((dep) => dependencies.add(dep));
    }
  }

  // Deduplicate files by path
  const uniqueFiles = Array.from(
    new Map(files.map((file) => [file.path, file])).values()
  );

  return {
    dependencies: Array.from(dependencies),
    files: uniqueFiles,
  };
}

async function createTempSourceFile(filename: string) {
  const dir = await fs.mkdtemp(path.join(tmpdir(), "mercur-"));
  return path.join(dir, filename);
}

// This determines the registry type based on the file path.
function determineFileType(
  moduleSpecifier: string
): z.infer<typeof registryItemTypeSchema> {
  if (moduleSpecifier.includes("/workflows/")) {
    return "registry:workflow";
  }

  if (moduleSpecifier.includes("/api/")) {
    return "registry:api";
  }

  if (moduleSpecifier.includes("/links/")) {
    return "registry:link";
  }

  if (moduleSpecifier.includes("/modules/")) {
    return "registry:module";
  }

  if (
    moduleSpecifier.includes("/vendor") ||
    moduleSpecifier.includes("/vendorPages/")
  ) {
    return "registry:vendor";
  }

  if (
    moduleSpecifier.includes("/admin") ||
    moduleSpecifier.includes("/adminPages/")
  ) {
    return "registry:admin";
  }

  if (moduleSpecifier.includes("/lib/")) {
    return "registry:lib";
  }

  // Default to lib for unknown types
  return "registry:lib";
}

// Additional utility functions for local file support
export function isUrl(path: string) {
  try {
    new URL(path);
    return true;
  } catch {
    return false;
  }
}

export function isLocalFile(path: string) {
  return path.endsWith(".json") && !isUrl(path);
}

/**
 * Check if a registry item is universal (framework-agnostic).
 * A universal registry item must:
 * 1. Have files with explicit targets
 * It can be installed without framework detection or blocks.json.
 */
export function isUniversalRegistryItem(
  registryItem:
    | Pick<z.infer<typeof registryItemSchema>, "files" | "type">
    | null
    | undefined
): boolean {
  if (!registryItem) {
    return false;
  }

  const files = registryItem.files ?? [];

  // If there are files, all must have targets
  return files.every((file) => !!file.target);
}

// Deduplicates files based on their resolved target paths.
// When multiple files resolve to the same target path, the last one wins.
export async function deduplicateFilesByTarget(
  filesArrays: Array<z.infer<typeof registryItemFileSchema>[] | undefined>,
  config: Config
) {
  // Fallback to simple concatenation when we don't have complete config.
  if (!canDeduplicateFiles(config)) {
    return z
      .array(registryItemFileSchema)
      .parse(filesArrays.flat().filter(Boolean));
  }

  const targetMap = new Map<string, z.infer<typeof registryItemFileSchema>>();
  const allFiles = z
    .array(registryItemFileSchema)
    .parse(filesArrays.flat().filter(Boolean));

  allFiles.forEach((file) => {
    // Use file path as the key for deduplication
    const resolvedPath = file.target || file.path;

    if (resolvedPath) {
      // Last one wins - overwrites previous entry.
      targetMap.set(resolvedPath, file);
    }
  });

  return Array.from(targetMap.values());
}

// Checks if the config has the minimum required paths for file deduplication.
export function canDeduplicateFiles(config: Config) {
  return !!(
    config?.resolvedPaths?.cwd &&
    (config?.resolvedPaths?.lib ||
      config?.resolvedPaths?.workflows ||
      config?.resolvedPaths?.api ||
      config?.resolvedPaths?.modules)
  );
}
