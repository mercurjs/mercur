import { existsSync, readFileSync } from "fs"
import { join } from "path"

import { isPatchApplied, readPatchedFiles } from "../apply-patch"
import { PATCHES } from "../manifest"
import { resolvePackageCopies } from "../resolve-package-dirs"
import { applyHunks, parseUnifiedDiff, reverse } from "../unified-diff"
import { isWithinRange } from "../version"

const PATCH_DIR = join(__dirname, "..", "patches")

describe("patches", () => {
    describe.each(PATCHES)("$file", (entry) => {
        const patchFilePath = join(PATCH_DIR, entry.file)

        it("ships the patch file the manifest points at", () => {
            expect(existsSync(patchFilePath)).toBe(true)
        })

        // The whole point of a patch is that it stops matching when upstream
        // moves. This is the gate that turns that into a CI failure rather than
        // a boot failure in someone's marketplace.
        // Package-manager stores are shared between checkouts, so a sweep also
        // turns up versions this project never loads. Only the copy the project
        // resolves has to accept the patch.
        const inRange = () =>
            resolvePackageCopies(entry.package).filter(
                (copy) =>
                    copy.version && isWithinRange(copy.version, entry.compatible)
            )

        it("applies to every in-range copy of the target package", () => {
            const copies = inRange()
            expect(copies.length).toBeGreaterThan(0)

            for (const copy of copies) {
                expect(readPatchedFiles(copy.dir, patchFilePath)).not.toBeNull()
            }
        })

        it("is not reported as already applied against pristine sources", () => {
            for (const copy of inRange()) {
                expect(isPatchApplied(copy.dir, patchFilePath)).toBe(false)
            }
        })

        it("reverses cleanly once applied", () => {
            const files = parseUnifiedDiff(readFileSync(patchFilePath, "utf8"))

            for (const copy of inRange()) {
                for (const file of files) {
                    const source = readFileSync(join(copy.dir, file.path), "utf8")
                    const patched = applyHunks(source, file.hunks)

                    expect(patched).not.toBeNull()
                    expect(applyHunks(patched as string, reverse(file.hunks))).toEqual(
                        source
                    )
                }
            }
        })

        it("refuses to apply when the surrounding context has moved", () => {
            const files = parseUnifiedDiff(readFileSync(patchFilePath, "utf8"))
            const [copy] = inRange()

            for (const file of files) {
                const source = readFileSync(join(copy.dir, file.path), "utf8")
                const contextLine = file.hunks[0].before.find((line) => line.trim())!
                const drifted = source.replace(
                    contextLine,
                    `${contextLine} /* upstream moved */`
                )

                expect(applyHunks(drifted, file.hunks)).toBeNull()
            }
        })
    })
})
