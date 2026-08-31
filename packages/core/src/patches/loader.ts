import Module from "module"

import type { PatchedFile } from "./apply-patch"

type CompilableModule = { _compile(source: string, filename: string): unknown }
type LoaderExtension = (module: CompilableModule, filename: string) => void
type ModuleInternals = {
  _extensions: Record<string, LoaderExtension>
}

const internals = Module as unknown as ModuleInternals

/** Absolute file path -> patched source, consulted on every `.js` load. */
const overrides = new Map<string, string>()

let installed = false

// Patches are applied in memory rather than written to `node_modules`: a server
// boot has no business mutating installed packages, workers would race each
// other doing it, and a file already required cannot be un-required cleanly.
// Intercepting the loader keeps the change scoped to this process.
function install(): void {
  if (installed) return

  const original = internals._extensions[".js"]

  internals._extensions[".js"] = function (module, filename) {
    const patched = overrides.get(filename)
    if (patched !== undefined) {
      module._compile(patched, filename)
      return
    }
    original(module, filename)
  }

  installed = true
}

export function isAlreadyLoaded(absolutePath: string): boolean {
  return Object.prototype.hasOwnProperty.call(require.cache, absolutePath)
}

export function isOverridden(absolutePath: string): boolean {
  return overrides.has(absolutePath)
}

export function registerOverrides(
  packageDir: string,
  files: PatchedFile[],
  resolve: (packageDir: string, relativePath: string) => string
): void {
  install()

  for (const file of files) {
    overrides.set(resolve(packageDir, file.relativePath), file.source)
  }
}
