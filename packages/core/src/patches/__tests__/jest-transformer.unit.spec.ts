import { readFileSync } from "fs"
import { createRequire } from "module"
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

    it.each([
        ["dist/payment/workflows/capture-payment.js", "paymentCaptured"],
        ["dist/payment/workflows/refund-payment.js", "paymentRefunded"],
        [
            "dist/order/workflows/mark-order-fulfillment-as-delivered.js",
            "fulfillmentDelivered",
        ],
    ])("exposes the hook in %s", (relativePath, hookName) => {
        const sourcePath = join(copy().dir, relativePath)
        const { code } = transform(readFileSync(sourcePath, "utf8"), sourcePath)

        expect(code).toContain(`createHook)("${hookName}"`)
        expect(code).toMatch(new RegExp(`hooks: \\[[^\\]]*\\b${hookName}\\]`))
    })

    it("scopes promotion adjustments to the seller in prepare-adjustments-from-promotion-actions", () => {
        const sourcePath = join(
            copy().dir,
            "dist/cart/steps/prepare-adjustments-from-promotion-actions.js"
        )
        const { code } = transform(readFileSync(sourcePath, "utf8"), sourcePath)

        expect(code).toContain('fields: ["id", "code", "seller.id"]')
        expect(code).toContain('fields: ["id", "offer.seller_id"]')
    })

    it("resolves a link whose modules come back from jsonb in the wrong order", () => {
        const linkEntry = PATCHES.find(
            (patch) => patch.package === "@medusajs/modules-sdk"
        )!
        const linkCopy = resolvePackageCopies(linkEntry.package).find(
            (candidate) =>
                candidate.version &&
                isWithinRange(candidate.version, linkEntry.compatible)
        )!
        const sourcePath = join(linkCopy.dir, "dist/link.js")
        const { code } = transform(readFileSync(sourcePath, "utf8"), sourcePath)

        const sandbox = { exports: {} as Record<string, unknown> }
        new Function(
            "exports",
            "require",
            "module",
            "__filename",
            "__dirname",
            code
        )(
            sandbox.exports,
            createRequire(sourcePath),
            sandbox,
            sourcePath,
            linkCopy.dir
        )

        const link = Object.create(
            (sandbox.exports.Link as { prototype: object }).prototype
        ) as {
            getLinkModule: (...args: string[]) => unknown
            getLinkDataConfig: (link: object) => { moduleA: string; moduleB: string }
        }
        link.getLinkModule = (...args: string[]) =>
            args.join("-") === "order-order_id-cart-cart_id" ? {} : undefined

        expect(
            link.getLinkDataConfig({
                cart: { cart_id: "cart_1" },
                order: { order_id: "order_1" },
            })
        ).toMatchObject({ moduleA: "order", moduleB: "cart" })
        expect(
            link.getLinkDataConfig({
                order: { order_id: "order_1" },
                cart: { cart_id: "cart_1" },
            })
        ).toMatchObject({ moduleA: "order", moduleB: "cart" })
    })

    it("leaves files it does not target untouched", () => {
        const source = "module.exports = 1\n"
        expect(transform(source, "/tmp/somewhere/else.js").code).toEqual(source)
    })
})
