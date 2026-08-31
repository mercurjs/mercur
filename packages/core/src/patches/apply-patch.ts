import { applyPatch, parsePatch } from "diff"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

export type PatchedFile = {
  /** Path of the patched file relative to the package root. */
  relativePath: string
  source: string
}

function targetPath(patchHeaderPath: string): string {
  // `git diff` writes `b/dist/...`; strip the destination prefix.
  return patchHeaderPath.replace(/^[ab]\//, "")
}

/**
 * Reads every file a patch touches and returns their patched source. Nothing is
 * written to disk — the results are handed to the module loader hook, which
 * compiles them in place of the originals.
 *
 * Returns `null` when a hunk does not apply, which is the signal that upstream
 * has moved and the patch must be regenerated. A patch that cannot be applied
 * is never partially applied.
 */
export function readPatchedFiles(
  packageDir: string,
  patchFilePath: string
): PatchedFile[] | null {
  const patches = parsePatch(readFileSync(patchFilePath, "utf8"))
  const patched: PatchedFile[] = []

  for (const patch of patches) {
    const relativePath = targetPath(patch.newFileName ?? patch.oldFileName ?? "")
    if (!relativePath) return null

    const filePath = join(packageDir, relativePath)
    if (!existsSync(filePath)) return null

    const result = applyPatch(readFileSync(filePath, "utf8"), patch)
    if (result === false) return null

    patched.push({ relativePath, source: result })
  }

  return patched.length ? patched : null
}

/**
 * True when every hunk reverses cleanly, meaning the patch is already present.
 * The equivalent of `git apply --reverse --check`.
 */
export function isPatchApplied(
  packageDir: string,
  patchFilePath: string
): boolean {
  const patches = parsePatch(readFileSync(patchFilePath, "utf8"))

  for (const patch of patches) {
    const relativePath = targetPath(patch.newFileName ?? patch.oldFileName ?? "")
    const filePath = join(packageDir, relativePath)
    if (!existsSync(filePath)) return false

    const reversed = {
      ...patch,
      hunks: patch.hunks.map((hunk) => ({
        ...hunk,
        oldStart: hunk.newStart,
        oldLines: hunk.newLines,
        newStart: hunk.oldStart,
        newLines: hunk.oldLines,
        lines: hunk.lines.map((line) => {
          if (line.startsWith("+")) return `-${line.slice(1)}`
          if (line.startsWith("-")) return `+${line.slice(1)}`
          return line
        }),
      })),
    }

    if (applyPatch(readFileSync(filePath, "utf8"), reversed) === false) {
      return false
    }
  }

  return true
}
