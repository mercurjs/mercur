import Module from "module"
import { join } from "path"

import type { PatchedFile } from "./apply-patch"

type CompilableModule = { _compile(source: string, filename: string): unknown }
type LoaderExtension = (module: CompilableModule, filename: string) => void
type ModuleInternals = {
  _extensions: Record<string, LoaderExtension>
}

const internals = Module as unknown as ModuleInternals

/** Absolute file path -> patched source, consulted on every `.js` load. */
const overrides = new Map<string, string>()

/** Paths whose patched source was actually compiled, not merely registered. */
const compiled = new Set<string>()

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
      compiled.add(filename)
      return
    }
    original(module, filename)
  }

  installed = true
}

/**
 * Files whose patched source was compiled in place of the original. Registering
 * an override only takes effect if the module is required afterwards, so this
 * is the difference between a patch being staged and a patch being live.
 */
export function compiledPaths(): string[] {
  return [...compiled]
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

// `@mercurjs/core` is not always the first thing to pull in a target package —
// `@medusajs/test-utils` requires core-flows before it loads the config. A module already in the cache would keep its
// unpatched source forever, so the patched files are evicted and required again
// through the override above.
//
// Only the patched files are dropped, never the whole package: re-running an
// arbitrary core-flows module re-enters `createWorkflow`, and workflows whose
// step ids are generated rather than literal do not survive a second
// registration ("step definition already exists").
export function purgeFiles(absolutePaths: string[]): void {
  for (const filename of absolutePaths) {
    const cached = require.cache[filename]
    if (!cached) continue

    delete require.cache[filename]

    // Parents keep `children` arrays pointing at the evicted module; leaving it
    // there keeps the stale exports reachable through the module graph.
    for (const parent of Object.values(require.cache)) {
      const index = parent?.children?.indexOf(cached) ?? -1
      if (index !== -1) parent!.children.splice(index, 1)
    }
  }
}

type WorkflowManagerLike = {
  register: (workflowId: string, ...rest: unknown[]) => unknown
  unregister: (workflowId: string) => unknown
}

/**
 * Compiles the patched sources now, so the override is what the process holds.
 *
 * Re-running a module that calls `createWorkflow` hits Medusa's duplicate guard,
 * which only lets a workflow re-register when its step definition is byte-equal
 * — and step ids are generated, so a second load of the same file is not. The
 * reload replays the same source, so replacing the previous definition is the
 * correct outcome; `register` is swapped for the duration to say so.
 */
export function reload(packageDir: string, absolutePaths: string[]): void {
  const manager = loadWorkflowManager(packageDir)
  const original = manager?.register

  if (manager && original) {
    manager.register = function register(workflowId, ...rest) {
      manager.unregister(workflowId)
      return original.call(this, workflowId, ...rest)
    }
  }

  try {
    for (const filename of absolutePaths) {
      require(filename)
    }
  } finally {
    if (manager && original) manager.register = original
  }
}

/**
 * Evicts already-loaded files and compiles their patched source in place.
 *
 * Eviction alone does not reach code that required the package earlier: every
 * index above a patched file re-exports it through a getter over the evicted
 * module's `exports` object, so `require("@medusajs/core-flows")` keeps handing
 * out the unpatched workflow. Copying the fresh exports onto that stale object
 * is what makes the patch visible through the whole re-export chain.
 */
export function replaceLoaded(packageDir: string, absolutePaths: string[]): void {
  const previous = new Map<string, unknown>()
  for (const filename of absolutePaths) {
    previous.set(filename, require.cache[filename]?.exports)
  }

  purgeFiles(absolutePaths)
  reload(packageDir, absolutePaths)

  for (const [filename, stale] of previous) {
    const fresh: unknown = require.cache[filename]?.exports
    if (isObject(stale) && isObject(fresh) && stale !== fresh) {
      adoptExports(stale, fresh)
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function adoptExports(
  stale: Record<string, unknown>,
  fresh: Record<string, unknown>
): void {
  for (const key of Object.keys(fresh)) {
    const descriptor = Object.getOwnPropertyDescriptor(stale, key)

    if (!descriptor || descriptor.configurable) {
      Object.defineProperty(stale, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: fresh[key],
      })
    } else if (descriptor.writable) {
      stale[key] = fresh[key]
    }
  }
}

// Resolved from the patched package, not from `@mercurjs/core`: bun and pnpm
// give each dependent its own copy, and a `WorkflowManager` from a different
// copy holds a different registry than the one `createWorkflow` writes to.
function loadWorkflowManager(packageDir: string): WorkflowManagerLike | null {
  try {
    const requireFrom = Module.createRequire(join(packageDir, "index.js"))
    return (
      requireFrom("@medusajs/orchestration") as {
        WorkflowManager: WorkflowManagerLike
      }
    ).WorkflowManager
  } catch {
    return null
  }
}
