import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { Project, ScriptKind } from "ts-morph";
import type { Config } from "../schema";

const project = new Project({
  compilerOptions: {},
});

async function createTempSourceFile(filename: string) {
  const dir = await fs.mkdtemp(path.join(tmpdir(), "mercurjs-"));
  // Always use .ts extension for temp files to ensure proper parsing
  const baseName = path.basename(filename, path.extname(filename));
  return path.join(dir, `${baseName}.ts`);
}

export type TransformOpts = {
  filename: string;
  raw: string;
  config: Config;
  isRemote?: boolean;
};

function getScriptKind(filename: string): ScriptKind {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".tsx":
    case ".ts":
      // Use TS for JS files so import parsing works correctly
      return ScriptKind.TS;
    default:
      return ScriptKind.Unknown;
  }
}

export async function transformImports(opts: TransformOpts): Promise<string> {
  const ext = path.extname(opts.filename).toLowerCase();
  if (![".tsx", ".ts"].includes(ext)) {
    return opts.raw;
  }

  const scriptKind = getScriptKind(opts.filename);
  const tempFile = await createTempSourceFile(opts.filename);
  const sourceFile = project.createSourceFile(tempFile, opts.raw, {
    scriptKind,
  });

  for (const specifier of sourceFile.getImportStringLiterals()) {
    const updated = updateImportAliases(
      specifier.getLiteralValue(),
      opts.config
    );
    specifier.setLiteralValue(updated);
  }

  return sourceFile.getText();
}

function updateImportAliases(moduleSpecifier: string, config: Config) {
  if (moduleSpecifier.startsWith("@/workflows/")) {
    const rest = moduleSpecifier.replace(/^@\/workflows\//, "");
    return `${config.aliases.workflows}/${rest}`;
  }
  if (moduleSpecifier === "@/workflows") {
    return config.aliases.workflows;
  }

  if (moduleSpecifier.startsWith("@/api/")) {
    const rest = moduleSpecifier.replace(/^@\/api\//, "");
    return `${config.aliases.api}/${rest}`;
  }
  if (moduleSpecifier === "@/api") {
    return config.aliases.api;
  }

  if (moduleSpecifier.startsWith("@/links/")) {
    const rest = moduleSpecifier.replace(/^@\/links\//, "");
    return `${config.aliases.links}/${rest}`;
  }
  if (moduleSpecifier === "@/links") {
    return config.aliases.links;
  }

  if (moduleSpecifier.startsWith("@/modules/")) {
    const rest = moduleSpecifier.replace(/^@\/modules\//, "");
    return `${config.aliases.modules}/${rest}`;
  }
  if (moduleSpecifier === "@/modules") {
    return config.aliases.modules;
  }

  if (moduleSpecifier.startsWith("@/vendor/")) {
    const rest = moduleSpecifier.replace(/^@\/vendor\//, "");
    return `${config.aliases.vendor}/${rest}`;
  }
  if (moduleSpecifier === "@/vendor") {
    return config.aliases.vendor;
  }

  if (moduleSpecifier.startsWith("@/admin/")) {
    const rest = moduleSpecifier.replace(/^@\/admin\//, "");
    return `${config.aliases.admin}/${rest}`;
  }
  if (moduleSpecifier === "@/admin") {
    return config.aliases.admin;
  }

  if (moduleSpecifier.startsWith("@/lib/")) {
    const rest = moduleSpecifier.replace(/^@\/lib\//, "");
    return `${config.aliases.lib}/${rest}`;
  }
  if (moduleSpecifier === "@/lib") {
    return config.aliases.lib;
  }

  return moduleSpecifier;
}
