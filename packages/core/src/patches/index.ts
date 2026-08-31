import { existsSync, realpathSync } from "fs"
import { join } from "path"

import { isPatchApplied, readPatchedFiles } from "./apply-patch"
import {
  isAlreadyLoaded,
  isOverridden,
  purgeFiles,
  registerOverrides,
  reload,
} from "./loader"
import { PATCHES, type PatchEntry } from "./manifest"
import { resolvePackageCopies, type PackageCopy } from "./resolve-package-dirs"
import { isWithinRange } from "./version"

// Mercur has to correct a handful of Medusa internals that expose no hook.
// Shipping those corrections through a package manager is not an option:
// `templates/basic` supports bun, yarn, pnpm and npm, whose patch mechanisms are
// mutually incompatible, and none of them reach a marketplace that installed
// `@mercurjs/core` into an existing Medusa app.
//
// So the diffs live in `patches/` and are applied here, from `withMercur()`,
// which every project calls. They travel with the package version and arrive on
// a normal upgrade.
//
// Patches are applied in memory, never written to `node_modules`: a boot has no
// business mutating installed packages, workers would race doing it, and a file
// that has already been required cannot be un-required cleanly.

const PATCH_DIR = join(__dirname, "patches")

export type ApplyPatchesOptions = {
  /** Patch file names to skip, for adopters who need to opt out of one. */
  disabled?: string[]
  logger?: Pick<Console, "info" | "warn">
}

function fail(entry: PatchEntry, copy: PackageCopy, detail: string): never {
  throw new Error(
    `[mercur] Patch "${entry.file}" ${detail} ` +
      `(${entry.package}@${copy.version ?? "unknown"}, ${copy.dir}).\n` +
      `It corrects: ${entry.reason}\n` +
      `Regenerate the patch for the installed version, or skip it via ` +
      `projectConfig.mercur.disabledPatches — skipping restores the bug above.`
  )
}

function resolveFile(packageDir: string, relativePath: string): string {
  const filePath = join(packageDir, relativePath)
  try {
    return realpathSync(filePath)
  } catch {
    return filePath
  }
}

/**
 * Returns true when the copy was patched. A non-primary copy that does not
 * match is skipped rather than fatal: package-manager stores are shared between
 * checkouts, so a sweep turns up versions this project never loads.
 */
function applyToCopy(
  entry: PatchEntry,
  copy: PackageCopy,
  patchFilePath: string
): boolean {
  if (copy.version && !isWithinRange(copy.version, entry.compatible)) {
    if (!copy.primary) return false
    fail(
      entry,
      copy,
      `was generated against ${entry.package} >=${entry.compatible.from} ` +
        `<${entry.compatible.to}, but ${copy.version} is what this project resolves`
    )
  }

  // Someone may have applied the same diff through their package manager. That
  // is a supported outcome, not a conflict.
  if (isPatchApplied(copy.dir, patchFilePath)) {
    return true
  }

  const patched = readPatchedFiles(copy.dir, patchFilePath)
  if (!patched) {
    if (!copy.primary) return false
    fail(entry, copy, "no longer applies — its context has changed upstream")
  }

  const paths = patched.map((file) => resolveFile(copy.dir, file.relativePath))
  const stale = paths.filter(
    (path) => isAlreadyLoaded(path) && !isOverridden(path)
  )

  registerOverrides(copy.dir, patched, resolveFile)

  // Something required these modules before `withMercur()` ran, so the cache
  // holds their unpatched source. Evict them and compile the patched source in
  // their place; a workflow module re-registers itself under the same id, which
  // is what makes the patch take effect on an already-loaded package.
  if (stale.length) {
    purgeFiles(stale)
    reload(copy.dir, stale)
  }

  return true
}

export function applyMercurPatches(options: ApplyPatchesOptions = {}): void {
  const disabled = new Set(options.disabled ?? [])
  const logger = options.logger ?? console

  for (const entry of PATCHES) {
    if (disabled.has(entry.file)) {
      logger.warn(
        `[mercur] Skipping patch "${entry.file}" (disabled). This restores the ` +
          `upstream behaviour it corrects: ${entry.reason}`
      )
      continue
    }

    const patchFilePath = join(PATCH_DIR, entry.file)
    if (!existsSync(patchFilePath)) {
      throw new Error(`[mercur] Patch file is missing: ${patchFilePath}`)
    }

    const copies = resolvePackageCopies(entry.package)
    if (!copies.length) {
      throw new Error(
        `[mercur] Patch "${entry.file}" found no installed copy of ${entry.package}.`
      )
    }

    const patchedCount = copies.filter((copy) =>
      applyToCopy(entry, copy, patchFilePath)
    ).length

    if (!patchedCount) {
      throw new Error(
        `[mercur] Patch "${entry.file}" matched no installed copy of ` +
          `${entry.package}. It corrects: ${entry.reason}`
      )
    }

    logger.info(
      `[mercur] Applied patch "${entry.file}" to ${patchedCount} copy/copies of ` +
        `${entry.package}`
    )

    // Load the patched package now rather than leaving it to Medusa: the
    // override only bites on first require, so failing here keeps the failure
    // next to the patch that caused it.
    require(entry.package)
  }
}

export { PATCHES } from "./manifest"
