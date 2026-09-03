import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

import {
  createProductAttributesWorkflow,
  createProductsWorkflow,
} from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import {
  AttributeType,
  MercurModules,
  ProductChangeActionType,
  ProductChangeStatus,
} from "@mercurjs/types"

jest.setTimeout(60000)

/**
 * SPEC-014 §G — vendor attribute batch endpoint
 * `POST /vendor/products/:id/attributes/batch`. Unlike the admin surface
 * (direct-apply), the vendor surface routes the batch through the ProductChange
 * "request" pipeline (`productEditUpdateAttributesWorkflow`): it stages one
 * `ATTRIBUTE_*` action per batch entry and returns `202 { product_change }`.
 * The test env runs with `MEDUSA_FF_PRODUCT_REQUEST=false`, so the staged
 * change auto-confirms inline — the batch engine still applies before the GET,
 * which is how these tests assert the applied state. Scoped to a product the
 * seller owns.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Vendor - product attributes batch", () => {
      let appContainer: MedusaContainer
      let seller: any
      let sellerHeaders: any

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const res = await createSellerUser(appContainer, {
          email: "vendor-attrs@test.com",
          name: "Vendor Attrs Store",
        })
        seller = res.seller
        sellerHeaders = res.headers
      })

      const createAttr = async (opts: {
        name: string
        type: AttributeType
        is_variant_axis?: boolean
        values?: string[]
      }) => {
        const { result } = await createProductAttributesWorkflow(
          appContainer,
        ).run({
          input: {
            attributes: [
              {
                name: opts.name,
                type: opts.type,
                is_variant_axis: opts.is_variant_axis ?? false,
                values: (opts.values ?? []).map((name, rank) => ({
                  name,
                  rank,
                })),
              },
            ],
          },
        })
        const id = result[0].id
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_attribute",
          fields: ["id", "values.id", "values.name"],
          filters: { id },
        })
        const byName = new Map<string, string>(
          (data[0].values ?? []).map((v: { id: string; name: string }) => [
            v.name,
            v.id,
          ]),
        )
        return { id, byName }
      }

      const createOwnedProduct = async () => {
        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [
              {
                title: "Vendor Product",
                status: "published",
                seller_ids: [seller.id],
              },
            ],
            created_by: seller.id,
          },
        })
        return (result as { id: string }[])[0].id
      }

      const batch = (productId: string, body: Record<string, unknown>) =>
        api.post(
          `/vendor/products/${productId}/attributes/batch`,
          body,
          sellerHeaders,
        )

      // Axis attachment via the ProductOption side (product.options populate is
      // broken on the 2.16 preview build).
      const optionAttached = async (productId: string, title: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["id", "title", "products.id"],
          filters: { title },
        })
        return (data ?? []).some(
          (o: any) =>
            o.title === title &&
            (o.products ?? []).some((p: any) => p.id === productId),
        )
      }

      // Re-read the applied attribute state after a staged batch
      // auto-confirms (PRODUCT_REQUEST off in the test env).
      const getProduct = async (productId: string) =>
        (await api.get(`/vendor/products/${productId}`, sellerHeaders)).data
          .product

      const scopedAttr = (product: any, name: string) =>
        (product.scoped_attributes ?? []).find((a: any) => a.name === name)

      it("add: inline axis → exclusive option + scoped attribute", async () => {
        const productId = await createOwnedProduct()

        const res = await batch(productId, {
          add: [{ title: "Size", values: ["S", "M"], is_variant_axis: true }],
        })

        expect(res.status).toEqual(202)
        expect(await optionAttached(productId, "Size")).toBe(true)
        const product = await getProduct(productId)
        const scoped = (product.scoped_attributes ?? []).find(
          (a: any) => a.name === "Size",
        )
        expect(scoped).toBeTruthy()
      })

      it("update: rename a scoped axis attribute via the staged batch (202 + auto-confirm)", async () => {
        const productId = await createOwnedProduct()
        const added = await batch(productId, {
          add: [{ title: "Size", values: ["S", "M"], is_variant_axis: true }],
        })
        expect(added.status).toEqual(202)
        const sizeId = scopedAttr(await getProduct(productId), "Size").id

        // The vendor edit form sends rename + value add in one update entry; the
        // `title` rides verbatim through the ProductChange action to the engine.
        const res = await batch(productId, {
          update: [{ id: sizeId, title: "Sizing", add: [{ value: "L" }] }],
        })

        expect(res.status).toEqual(202)
        const product = await getProduct(productId)
        const renamed = scopedAttr(product, "Sizing")
        expect(renamed).toBeTruthy()
        expect(scopedAttr(product, "Size")).toBeFalsy()
        expect((renamed.values ?? []).map((v: any) => v.name).sort()).toEqual([
          "L",
          "M",
          "S",
        ])
      })

      it("allows any seller to request changes on a master product it did not create", async () => {
        // master product created by a different actor — every seller can
        // still request a change through the product-edit pipeline.
        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [{ title: "Foreign", status: "published" }],
            created_by: "foreign-actor",
          },
        })
        const foreignId = (result as { id: string }[])[0].id
        const attr = await createAttr({ name: "Material", type: "text" })

        const res = await batch(foreignId, {
          add: [{ id: attr.id, value: "x" }],
        })

        expect(res.status).toEqual(202)
      })

      // --- request flow: ProductChange staging via the batch endpoint ---

      it("stages one ATTRIBUTE_ADD / ATTRIBUTE_UPDATE / ATTRIBUTE_REMOVE action per batch entry", async () => {
        const color = await createAttr({
          name: "ReqColor",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Red", "Blue"],
        })
        const flag = await createAttr({ name: "ReqFlag", type: "toggle" })
        const text = await createAttr({ name: "ReqText", type: "text" })
        const productId = await createOwnedProduct()

        // Seed links to update / remove against (auto-confirmed inline).
        await batch(productId, {
          add: [
            { id: flag.id, value: true },
            { id: text.id, value: "seed" },
          ],
        })

        const res = await batch(productId, {
          add: [{ id: color.id, value_ids: [color.byName.get("Red")!] }],
          update: [{ id: flag.id, value: false }],
          remove: [text.id],
        })

        expect(res.status).toEqual(202)
        const actions = res.data.product_change.actions as Array<{
          action: string
          details: Record<string, any>
        }>
        const byType = (t: ProductChangeActionType) =>
          actions.filter((a) => a.action === t)

        expect(byType(ProductChangeActionType.ATTRIBUTE_ADD)).toHaveLength(1)
        expect(byType(ProductChangeActionType.ATTRIBUTE_UPDATE)).toHaveLength(1)
        expect(byType(ProductChangeActionType.ATTRIBUTE_REMOVE)).toHaveLength(1)
        // Each action carries the raw batch op verbatim in `details`.
        expect(
          byType(ProductChangeActionType.ATTRIBUTE_ADD)[0].details.attribute.id,
        ).toBe(color.id)
        expect(
          byType(ProductChangeActionType.ATTRIBUTE_UPDATE)[0].details.update.id,
        ).toBe(flag.id)
        expect(
          byType(ProductChangeActionType.ATTRIBUTE_REMOVE)[0].details
            .attribute_id,
        ).toBe(text.id)
      })

      it("rejects a second batch while a pending change is open", async () => {
        const attr = await createAttr({ name: "PendingAttr", type: "text" })
        const productId = await createOwnedProduct()

        // Seed a PENDING change directly (the test env auto-confirms HTTP
        // batches, so simulate the approval-queue state explicitly).
        const service: any = appContainer.resolve(MercurModules.PRODUCT_EDIT)
        const [change] = await service.createProductChanges([
          {
            product_id: productId,
            created_by: seller.id,
            status: ProductChangeStatus.PENDING,
          },
        ])
        await service.createProductChangeActions([
          {
            product_change_id: change.id,
            product_id: productId,
            action: ProductChangeActionType.ATTRIBUTE_ADD,
            details: { attribute: { id: attr.id, value: "pending" } },
          },
        ])

        const err = await batch(productId, {
          add: [{ id: attr.id, value: "another" }],
        }).catch((e) => e)

        expect(err.response.status).toBeGreaterThanOrEqual(400)
      })

    })

    describe("Vendor - product list scoping", () => {
      let appContainer: MedusaContainer
      let sellerA: any
      let headersA: any
      let headersB: any

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const a = await createSellerUser(appContainer, {
          email: "scope-a@test.com",
          name: "Scope A Store",
        })
        sellerA = a.seller
        headersA = a.headers
        const b = await createSellerUser(appContainer, {
          email: "scope-b@test.com",
          name: "Scope B Store",
        })
        headersB = b.headers
      })

      const createProduct = async (
        title: string,
        status: string,
        createdBy: string,
        sellerIds?: string[]
      ) => {
        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [{ title, status, seller_ids: sellerIds } as any],
            created_by: createdBy,
          },
        })
        return (result as { id: string }[])[0].id
      }

      it("scopes the vendor list to the seller's own proposed products plus published", async () => {
        const proposedByA = await createProduct("A Proposed", "proposed", sellerA.id)
        const published = await createProduct("Global Published", "published", "other-actor")

        const listAsA = await api.get("/vendor/products?limit=100", headersA)
        const idsA = listAsA.data.products.map((p: { id: string }) => p.id)
        expect(idsA).toEqual(expect.arrayContaining([proposedByA, published]))

        const listAsB = await api.get("/vendor/products?limit=100", headersB)
        const idsB = listAsB.data.products.map((p: { id: string }) => p.id)
        expect(idsB).toContain(published)
        expect(idsB).not.toContain(proposedByA)
      })

      it("hides a restricted published product from sellers it is not assigned to", async () => {
        // Published, but restricted (product_seller) to seller A only.
        const restrictedToA = await createProduct(
          "Restricted To A",
          "published",
          "other-actor",
          [sellerA.id]
        )

        const listAsA = await api.get("/vendor/products?limit=100", headersA)
        const idsA = listAsA.data.products.map((p: { id: string }) => p.id)
        expect(idsA).toContain(restrictedToA)

        const listAsB = await api.get("/vendor/products?limit=100", headersB)
        const idsB = listAsB.data.products.map((p: { id: string }) => p.id)
        expect(idsB).not.toContain(restrictedToA)
      })
    })

    // MER-246: creating a product with several images persisted only one in the
    // UI. The images survive the create workflow, but the vendor detail query
    // omits the relation from its server defaults, so the bare `*images` the
    // panel requested resolved against nothing and returned no images — leaving
    // only the scalar `thumbnail`. The panel now spells the relation out
    // (`images.id,images.url,images.rank`); this guards that contract.
    describe("Vendor - product images", () => {
      let appContainer: MedusaContainer
      let sellerHeaders: any

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const res = await createSellerUser(appContainer, {
          email: "vendor-images@test.com",
          name: "Vendor Images Store",
        })
        sellerHeaders = res.headers
      })

      it("returns every image on the detail query, not just the thumbnail", async () => {
        const images = [
          { url: "https://example.com/mer-246-1.png" },
          { url: "https://example.com/mer-246-2.png" },
          { url: "https://example.com/mer-246-3.png" },
        ]

        const created = await api.post(
          "/vendor/products",
          {
            status: "published",
            title: "Multi Image Product",
            images,
            thumbnail: images[0].url,
            variants: [{ title: "Default" }],
          },
          sellerHeaders
        )
        const productId = created.data.product.id

        const res = await api.get(
          `/vendor/products/${productId}?fields=images.id,images.url,images.rank`,
          sellerHeaders
        )

        const returned: { url: string }[] = res.data.product.images ?? []
        expect(returned).toHaveLength(images.length)
        expect(returned.map((i) => i.url).sort()).toEqual(
          images.map((i) => i.url).sort()
        )
      })
    })
  },
})
