import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"

jest.setTimeout(60000)

type IndexEntity = {
    fields: string[]
    parents: { ref?: { entity: string } }[]
}

type IndexInternals = {
    buildSchemaObjectRepresentation_: () => void
    schemaObjectRepresentation_: Record<string, IndexEntity>
}

// A relation that does not resolve through a single link makes the index walk
// every module schema for a path; with the review and offer links in place it
// once chained Review into the Product sync (null review rows broke it).
medusaIntegrationTestRunner({
    testSuite: ({ getContainer }) => {
        describe("Index engine schema", () => {
            let representation: Record<string, IndexEntity>

            beforeAll(() => {
                const index = getContainer().resolve<IndexInternals>(
                    Modules.INDEX
                )
                index.buildSchemaObjectRepresentation_()
                representation = index.schemaObjectRepresentation_
            })

            it("indexes only the declared entities and their link tables", () => {
                const entities = Object.keys(representation)
                    .filter((key) => !key.startsWith("_"))
                    .sort()

                expect(entities).toEqual(
                    [
                        "LinkOfferProduct",
                        "LinkOfferSeller",
                        "LinkProductSalesChannel",
                        "LinkProductSeller",
                        "Offer",
                        "Product",
                        "ProductVariant",
                        "SalesChannel",
                        "Seller",
                    ].sort()
                )
            })

            it("reaches every parent through a direct relation or link", () => {
                for (const [name, entity] of Object.entries(representation)) {
                    if (name.startsWith("_") || name.startsWith("Link")) {
                        continue
                    }
                    const crossEntityFields = entity.fields.filter((field) =>
                        field.includes(".")
                    )
                    const sameModuleParents =
                        name === "ProductVariant" ? ["product.id"] : []
                    expect({ name, crossEntityFields }).toEqual({
                        name,
                        crossEntityFields: sameModuleParents,
                    })
                }
            })
        })
    },
})
