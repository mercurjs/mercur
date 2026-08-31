import { existsSync } from "fs"
import { join } from "path"

import { isPatchApplied, readPatchedFiles } from "./apply-patch"
import { isAlreadyLoaded, isOverridden, registerOverrides } from "./loader"
import { PATCHES, type PatchEntry } from "./manifest"
import { readPackageVersion, resolvePackageDirs } from "./resolve-package-dirs"
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
// The lifecycle follows Expo's `patch-project`: probe before applying, and
// refuse loudly rather than degrade to a silent no-op. A hunk that no longer
// matches its context is upstream telling us the patch is stale.

const PATCH_DIR = join(__dirname, "patches")

export type ApplyPatchesOptions = {
  /** Patch files to skip, for adopters who need to opt out of one. */
  disabled?: string[]
  logger?: Pick<Console, "info" | "warn">
}

function fail(entry: PatchEntry, dir: string, detail: string): never {
  throw new Error(
    `[mercur] Patch "${entry.file}" ${detail} (${dir}).\n` +
      `It corrects: ${entry.reason}\n` +
      `Regenerate the patch for the installed version, or skip it via ` +
      `projectConfig.mercur.disabledPatches — skipping restores the bug above.`
  )
}

function applyToCopy(
  entry: PatchEntry,
  dir: string,
  logger: NonNullable<ApplyPatchesOptions["logger"]>
): void {
  const patchFilePath = join(PATCH_DIR, entry.file)
  if (!existsSync(patchFilePath)) {
    throw new Error(`[mercur] Patch file is missing: ${patchFilePath}`)
  }

  const version = readPackageVersion(dir)
  if (version && !isWithinRange(version, entry.compatible)) {
    fail(
      entry,
      dir,
      `was generated against ${entry.package} >=${entry.compatible.from} ` +
        `<${entry.compatible.to}, but ${version} is installed`
    )
  }

  // Someone may have applied the same diff through their package manager. That
  // is a supported outcome, not a conflict.
  if (isPatchApplied(dir, patchFilePath)) {
    return
  }

  const patched = readPatchedFiles(dir, patchFilePath)
  if (!patched) {
    fail(entry, dir, "no longer applies — its context has changed upstream")
  }

  const resolve = (packageDir: string, relativePath: string) =>
    join(packageDir, relativePath)

  const alreadyLoaded = patched
    .map((file) => resolve(dir, file.relativePath))
    .filter((path) => isAlreadyLoaded(path) && !isOverridden(path))

  if (alreadyLoaded.length) {
    fail(
      entry,
      dir,
      `targets modules that were already loaded before withMercur() ran ` +
        `(${alreadyLoaded.join(", ")}), so the patch cannot take effect`
    )
  }

  registerOverrides(dir, patched, resolve)

  logger.info(
    `[mercur] Applied patch "${entry.file}" to ${entry.package}@${
      version ?? "unknown"
    } (${patched.length} file(s))`
  )
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

    const dirs = resolvePackageDirs(entry.package)
    if (!dirs.length) {
      throw new Error(
        `[mercur] Patch "${entry.file}" found no installed copy of ${entry.package}.`
      )
    }

    for (const dir of dirs) {
      applyToCopy(entry, dir, logger)
    }

    // Load the patched package now rather than leaving it to Medusa: the
    // override only bites on first require, so failing here keeps the failure
    // next to the patch that caused it.
    require(entry.package)
  }
}

export { PATCHES } from "./manifest"
