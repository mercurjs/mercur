import { existsSync, readFileSync } from "fs"
import { join, sep } from "path"

import { PATCHES } from "./manifest"
import { applyHunks, parseUnifiedDiff, reverse } from "./unified-diff"

export type PatchedFile = {
  /** Path of the patched file relative to the package root. */
  relativePath: string
  source: string
}

/**
 * Reads every file a patch touches and returns their patched source. Nothing is
 * written to disk — the results are handed to the module loader hook, which
 * compiles them in place of the originals.
 *
 * Returns `null` when a hunk does not apply, which is the signal that upstream
 * has moved and the patch must be regenerated.
 */
export function readPatchedFiles(
  packageDir: string,
  patchFilePath: string
): PatchedFile[] | null {
  const files = parseUnifiedDiff(readFileSync(patchFilePath, "utf8"))
  const patched: PatchedFile[] = []

  for (const file of files) {
    const filePath = join(packageDir, file.path)
    if (!existsSync(filePath)) return null

    const result = applyHunks(readFileSync(filePath, "utf8"), file.hunks)
    if (result === null) return null

    patched.push({ relativePath: file.path, source: result })
  }

  return patched.length ? patched : null
}

/**
 * True when every hunk reverses cleanly, meaning the patch is already present —
 * the equivalent of `git apply --reverse --check`. Someone may have applied the
 * same diff through their own package manager, which is a supported outcome
 * rather than a conflict.
 */
export function isPatchApplied(
  packageDir: string,
  patchFilePath: string
): boolean {
  const files = parseUnifiedDiff(readFileSync(patchFilePath, "utf8"))

  for (const file of files) {
    const filePath = join(packageDir, file.path)
    if (!existsSync(filePath)) return false

    const source = readFileSync(filePath, "utf8")
    if (applyHunks(source, reverse(file.hunks)) === null) return false
  }

  return true
}

/**
 * Applies whichever patch targets `absolutePath`, if any, returning the patched
 * source or `null` when the file is not a patch target.
 *
 * This is the loader-agnostic half of the system: Node's require hook and the
 * Jest transformer both funnel through it, so a patch means the same thing in
 * production and under test.
 */
export function patchSourceForPath(
  absolutePath: string,
  source: string
): string | null {
  const normalized = absolutePath.split(sep).join("/")

  for (const entry of PATCHES) {
    const patchFilePath = join(__dirname, "patches", entry.file)
    if (!existsSync(patchFilePath)) continue

    for (const file of parseUnifiedDiff(readFileSync(patchFilePath, "utf8"))) {
      const suffix = `${entry.package}/${file.path}`
      if (!normalized.endsWith(suffix)) continue

      // Already patched (a package-manager patch, or a second pass): the
      // forward hunks will not match, and that is not an error.
      return applyHunks(source, file.hunks)
    }
  }

  return null
}
