import { readFileSync } from "fs"
import { join } from "path"

import { process as transform } from "../jest-transformer"
import { PATCHES } from "../manifest"
import { resolvePackageCopies } from "../resolve-package-dirs"
import { isWithinRange } from "../version"

// Jest bypasses Node's module hooks, so the runtime patch mechanism cannot fire
// here. If this fails, every suite is exercising unpatched Medusa code while the
// runtime reports the patch as applied — the silent divergence the transformer
// exists to prevent.
describe("jest transformer", () => {
    it("serves patched core-flows sources to the test environment", () => {
        const entry = PATCHES.find(
            (patch) => patch.package === "@medusajs/core-flows"
        )!
        const copy = resolvePackageCopies(entry.package).find(
            (candidate) =>
                candidate.version &&
                isWithinRange(candidate.version, entry.compatible)
        )

        expect(copy).toBeDefined()

        const fields = require(
            join(copy!.dir, "dist/cart/utils/fields.js")
        ) as { cartFieldsForRefreshSteps: string[] }

        expect(fields.cartFieldsForRefreshSteps).toContain(
            "items.offer.shipping_profile_id"
        )
    })

    // Asserted through the transformer rather than by requiring the module,
    // whose top-level registers a workflow.
    it("serves the patched refresh workflow", () => {
        const entry = PATCHES.find(
            (patch) => patch.package === "@medusajs/core-flows"
        )!
        const copy = resolvePackageCopies(entry.package).find(
            (candidate) =>
                candidate.version &&
                isWithinRange(candidate.version, entry.compatible)
        )!

        const workflowPath = join(
            copy.dir,
            "dist/cart/workflows/refresh-cart-shipping-methods.js"
        )
        const { code } = transform(readFileSync(workflowPath, "utf8"), workflowPath)

        expect(code).toContain("item.offer?.shipping_profile_id ??")
    })

    it("leaves files it does not target untouched", () => {
        const source = "module.exports = 1\n"
        expect(transform(source, "/tmp/somewhere/else.js").code).toEqual(source)
    })
})
