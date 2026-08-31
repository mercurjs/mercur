import { readFileSync } from "fs"
import { join } from "path"

import { process as transform } from "../jest-transformer"
import { PATCHES } from "../manifest"
import { resolvePackageCopies } from "../resolve-package-dirs"
import { parseUnifiedDiff } from "../unified-diff"
import { isWithinRange } from "../version"

// Jest loads modules through its own registry and never consults Node's module
// hooks, so the runtime patch mechanism cannot fire here. Without the
// transformer every suite exercises unpatched Medusa code while the runtime
// reports the patch as applied.
describe("jest transformer", () => {
    const entry = PATCHES.find(
        (patch) => patch.package === "@medusajs/core-flows"
    )!

    const copy = () =>
        resolvePackageCopies(entry.package).find(
            (candidate) =>
                candidate.version &&
                isWithinRange(candidate.version, entry.compatible)
        )!

    it("serves patched source for every file the patch targets", () => {
        const patchFilePath = join(__dirname, "..", "patches", entry.file)
        const files = parseUnifiedDiff(readFileSync(patchFilePath, "utf8"))

        expect(files.length).toBeGreaterThan(0)

        for (const file of files) {
            const sourcePath = join(copy().dir, file.path)
            const original = readFileSync(sourcePath, "utf8")
            const { code } = transform(original, sourcePath)

            expect(code).not.toEqual(original)
            expect(code).toContain("MERCUR:")
        }
    })

    it("disables the orphan-profile cleanup that deletes co-sold sellers' methods", () => {
        const sourcePath = join(
            copy().dir,
            "dist/cart/workflows/refresh-cart-shipping-methods.js"
        )
        const { code } = transform(readFileSync(sourcePath, "utf8"), sourcePath)

        expect(code).toContain("const shouldCleanupOrphanProfiles = false")
    })

    it("leaves files it does not target untouched", () => {
        const source = "module.exports = 1\n"
        expect(transform(source, "/tmp/somewhere/else.js").code).toEqual(source)
    })
})
