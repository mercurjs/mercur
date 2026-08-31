import { createHash } from "crypto"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

import { patchSourceForPath } from "./apply-patch"
import { PATCHES } from "./manifest"

// Jest loads modules through its own registry and never consults Node's
// `Module._extensions`, so the require hook that applies these patches at
// runtime cannot fire under test. Without this transformer the patches would be
// silently inert in every test suite — production and tests would disagree
// about what the code does, which is worse than not patching at all.
//
// Register it ahead of the project's own transform, and let the two patched
// files through `transformIgnorePatterns`:
//
//   transform: {
//     "node_modules[\\\\/].*core-flows[\\\\/]dist[\\\\/]cart[\\\\/].*\\.js$":
//       "@mercurjs/core/patches/jest-transformer",
//     "^.+\\.[jt]s$": ["@swc/jest", { ... }],
//   },
//   transformIgnorePatterns: ["/node_modules/(?!.*core-flows[\\\\/]dist[\\\\/]cart[\\\\/])"],

type TransformOutput = { code: string }

function patchesFingerprint(): string {
  const hash = createHash("sha1")

  for (const entry of PATCHES) {
    const patchFilePath = join(__dirname, "patches", entry.file)
    hash.update(entry.file)
    if (existsSync(patchFilePath)) {
      hash.update(readFileSync(patchFilePath))
    }
  }

  return hash.digest("hex")
}

export function process(
  sourceText: string,
  sourcePath: string
): TransformOutput {
  return { code: patchSourceForPath(sourcePath, sourceText) ?? sourceText }
}

/**
 * Editing a patch has to invalidate Jest's transform cache, or a stale entry
 * serves the unpatched source and the suite quietly tests the wrong code.
 */
export function getCacheKey(sourceText: string, sourcePath: string): string {
  return createHash("sha1")
    .update(sourceText)
    .update(sourcePath)
    .update(patchesFingerprint())
    .digest("hex")
}

export default { process, getCacheKey }
