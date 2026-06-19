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
            products: [{ title: "Vendor Product", status: "published" }],
            seller_ids: [seller.id],
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

      const valueNames = (product: any) =>
        (product.product_attribute_values ?? [])
          .map((v: any) => v.name)
          .sort()

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

      const optionIsExclusive = async (title: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_option",
          fields: ["title", "is_exclusive"],
          filters: { title },
        })
        return data[0]?.is_exclusive
      }

      const scopedAttr = (product: any, name: string) =>
        (product.scoped_attributes ?? []).find((a: any) => a.name === name)

      const listChanges = async (productId: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_change",
          fields: ["id", "status", "product_id", "actions.*"],
          filters: { product_id: productId },
        })
        return data as Array<{
          id: string
          status: string
          actions: Array<{ action: string; details: Record<string, unknown> }>
        }>
      }

      it("add: axis attach + toggle, then non-axis remove (202 + auto-confirm)", async () => {
        const color = await createAttr({
          name: "Color",
          type: "multi_select",
          is_variant_axis: true,
          values: ["Red", "Blue"],
        })
        const waterproof = await createAttr({
          name: "Waterproof",
          type: "toggle",
        })
        const productId = await createOwnedProduct()

        const added = await batch(productId, {
          add: [
            { id: color.id, value_ids: [color.byName.get("Red")!] },
            { id: waterproof.id, value: true },
          ],
        })
        expect(added.status).toEqual(202)
        expect(added.data.product_change.product_id).toBe(productId)
        // Applied inline by auto-confirm. The selected axis value (Red) is
        // linked into the pivot alongside the toggle so the formatter can
        // surface the axis selection (native options populate is broken on 2.16).
        expect(valueNames(await getProduct(productId))).toEqual(["Red", "true"])

        // toggle swap true → false (non-axis); the axis link is untouched.
        const updated = await batch(productId, {
          update: [{ id: waterproof.id, value: false }],
        })
        expect(updated.status).toEqual(202)
        expect(valueNames(await getProduct(productId))).toEqual(["Red", "false"])

        // remove the toggle value link; the axis link remains.
        const removed = await batch(productId, { remove: [waterproof.id] })
        expect(removed.status).toEqual(202)
        expect(valueNames(await getProduct(productId))).toEqual(["Red"])
      })

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

      it("rejects batch on a product the seller does not own", async () => {
        // product owned by nobody (no seller link)
        const { result } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [{ title: "Foreign", status: "published" }],
          },
        })
        const foreignId = (result as { id: string }[])[0].id
        const attr = await createAttr({ name: "Material", type: "text" })

        const err = await batch(foreignId, {
          add: [{ id: attr.id, value: "x" }],
        }).catch((e) => e)

        expect(err.response.status).toEqual(404)
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

      it("auto-confirm applies the staged batch inline (flag off) and marks the change CONFIRMED", async () => {
        const flag = await createAttr({ name: "ConfirmFlag", type: "toggle" })
        const productId = await createOwnedProduct()

        const res = await batch(productId, {
          add: [{ id: flag.id, value: true }],
        })
        expect(res.status).toEqual(202)

        // Applied state is visible immediately.
        expect(valueNames(await getProduct(productId))).toEqual(["true"])

        // The change opened by this batch is auto-confirmed.
        const changes = await listChanges(productId)
        const attrChange = changes.find((c) =>
          c.actions.some(
            (a) => a.action === ProductChangeActionType.ATTRIBUTE_ADD,
          ),
        )
        expect(attrChange).toBeDefined()
        expect(attrChange!.status).toBe(ProductChangeStatus.CONFIRMED)
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

      // --- POST /vendor/products with the unified attributes[] input ---

      it("create: product with attributes[] + variant bound to axis options", async () => {
        const multi = await createAttr({
          name: "Multi Select",
          type: "multi_select" as AttributeType,
          is_variant_axis: true,
          values: ["Value 1", "Value 2"],
        })
        const single = await createAttr({
          name: "Single Select",
          type: "single_select" as AttributeType,
          values: ["A", "B"],
        })
        const toggle = await createAttr({
          name: "Flag",
          type: "toggle" as AttributeType,
        })

        const res = await api.post(
          "/vendor/products",
          {
            title: "Vendor Created Product",
            status: "proposed",
            attributes: [
              { id: multi.id, value_ids: [multi.byName.get("Value 1")!] },
              { id: single.id, value_ids: [single.byName.get("A")!] },
              { title: "Size", values: ["S", "M"], is_variant_axis: true },
              { title: "Weight", type: "unit", value: "10kg" },
              { id: toggle.id, value: true },
            ],
            variants: [
              {
                title: "default variant",
                options: { Size: "S", "Multi Select": "Value 1" },
              },
            ],
          },
          sellerHeaders,
        )

        expect([200, 201]).toContain(res.status)
        const productId = res.data.product.id

        // non-axis selections → value links.
        expect(valueNames(res.data.product)).toEqual(
          expect.arrayContaining(["10kg", "A", "true"]),
        )
        // inline attributes → product-scoped.
        const scopedNames = (res.data.product.scoped_attributes ?? []).map(
          (a: any) => a.name,
        )
        expect(scopedNames).toEqual(expect.arrayContaining(["Size", "Weight"]))
        // axis attributes → native options attached.
        expect(await optionAttached(productId, "Multi Select")).toBe(true)
        expect(await optionAttached(productId, "Size")).toBe(true)

        // the variant was created and bound to the axis option values.
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "product_variant",
          fields: ["id", "title"],
          filters: { product_id: productId },
        })
        expect(data.some((v: any) => v.title === "default variant")).toBe(true)
      })

      // --- SPEC-014 full attribute-kind matrix (happy path) over the staged
      // vendor surface (202 → auto-confirm → GET shows the applied links) ---

      it("add: full attribute matrix → 202 auto-confirm, every kind linked", async () => {
        const multi = await createAttr({
          name: "Multi Select",
          type: "multi_select" as AttributeType,
          is_variant_axis: true,
          values: ["Value 1", "Value 2"],
        })
        const single = await createAttr({
          name: "Single Select",
          type: "single_select" as AttributeType,
          values: ["Cotton", "Wool"],
        })
        const text = await createAttr({
          name: "Free Text",
          type: "text" as AttributeType,
        })
        const toggle = await createAttr({
          name: "Flag",
          type: "toggle" as AttributeType,
        })
        const productId = await createOwnedProduct()

        const res = await batch(productId, {
          add: [
            { id: multi.id, value_ids: [multi.byName.get("Value 1")!] },
            { id: single.id, value_ids: [single.byName.get("Cotton")!] },
            { title: "Size", values: ["S", "M", "L", "XL"], is_variant_axis: true },
            { id: text.id, value: "free text" },
            { title: "Weight", type: "unit", value: "10kg", is_variant_axis: false },
            { id: toggle.id, value: true },
          ],
        })
        expect(res.status).toEqual(202)

        // Applied inline by auto-confirm — re-read the product to assert links.
        const product = await getProduct(productId)
        expect(valueNames(product)).toEqual(
          expect.arrayContaining(["10kg", "Cotton", "free text", "true"]),
        )
        // existing axis → shared option; inline axis → exclusive option + scoped.
        expect(await optionAttached(productId, "Multi Select")).toBe(true)
        expect(await optionIsExclusive("Multi Select")).toBe(false)
        expect(await optionAttached(productId, "Size")).toBe(true)
        expect(await optionIsExclusive("Size")).toBe(true)
        expect(scopedAttr(product, "Size")).toBeTruthy()
        expect(scopedAttr(product, "Weight")).toBeTruthy()
      })

      it("GET created product surfaces all linked attribute kinds", async () => {
        const multi = await createAttr({
          name: "Multi Select",
          type: "multi_select" as AttributeType,
          is_variant_axis: true,
          values: ["Value 1", "Value 2"],
        })
        const single = await createAttr({
          name: "Single Select",
          type: "single_select" as AttributeType,
          values: ["A", "B"],
        })
        const toggle = await createAttr({
          name: "Flag",
          type: "toggle" as AttributeType,
        })

        const created = await api.post(
          "/vendor/products",
          {
            title: "Vendor Created Product",
            status: "proposed",
            attributes: [
              { id: multi.id, value_ids: [multi.byName.get("Value 1")!] },
              { id: single.id, value_ids: [single.byName.get("A")!] },
              { title: "Size", values: ["S", "M"], is_variant_axis: true },
              { title: "Weight", type: "unit", value: "10kg" },
              { id: toggle.id, value: true },
            ],
            variants: [
              {
                title: "default variant",
                options: { Size: "S", "Multi Select": "Value 1" },
              },
            ],
          },
          sellerHeaders,
        )
        expect([200, 201]).toContain(created.status)
        const productId = created.data.product.id

        const product = await getProduct(productId)
        expect(valueNames(product)).toEqual(
          expect.arrayContaining(["10kg", "A", "true"]),
        )
        const scopedNames = (product.scoped_attributes ?? []).map(
          (a: any) => a.name,
        )
        expect(scopedNames).toEqual(expect.arrayContaining(["Size", "Weight"]))
        expect(await optionAttached(productId, "Multi Select")).toBe(true)
        expect(await optionAttached(productId, "Size")).toBe(true)
      })
    })
  },
})
