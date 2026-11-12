import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"
import {
  applyProductAttributeChangeActionsWorkflow,
  createProductAttributesWorkflow,
} from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(60000)

/**
 * Internal attributes are operator-only: the vendor and store surfaces never
 * list them, never return their values on a product, and sellers cannot
 * reference them when creating or editing a product.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    let appContainer: MedusaContainer
    let seller: { id: string }
    let sellerHeaders: { headers: Record<string, string> }

    beforeAll(() => {
      appContainer = getContainer()
    })

    beforeEach(async () => {
      await createAdminUser(dbConnection, adminHeaders, appContainer)
      const res = await createSellerUser(appContainer, {
        email: "internal-attr-seller@test.com",
        name: "Internal Attr Store",
      })
      seller = res.seller
      sellerHeaders = res.headers
    })

    const createAttr = async (opts: {
      name: string
      is_internal?: boolean
      values: string[]
    }) => {
      const { result } = await createProductAttributesWorkflow(
        appContainer,
      ).run({
        input: {
          attributes: [
            {
              name: opts.name,
              type: "single_select",
              is_internal: opts.is_internal ?? false,
              values: opts.values.map((name, rank) => ({ name, rank })),
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

    const attachAsAdmin = async (
      productId: string,
      attribute: { id: string; byName: Map<string, string> },
      valueName: string,
    ) => {
      await applyProductAttributeChangeActionsWorkflow(appContainer).run({
        input: {
          product_id: productId,
          add: [{ id: attribute.id, value_ids: [attribute.byName.get(valueName)!] }],
          remove: [],
          update: [],
        },
      })
    }

    const attributeIdsOf = (product: any): string[] => [
      ...(product.attributes ?? []).map((a: any) => a.id),
      ...(product.product_attribute_values ?? []).map(
        (v: any) => v.attribute?.id ?? v.attribute_id,
      ),
      ...(product.scoped_attributes ?? []).map((a: any) => a.id),
    ]

    describe("Vendor - internal attributes", () => {
      it("list and detail hide internal attributes", async () => {
        const visible = await createAttr({ name: "Color", values: ["Red"] })
        const hidden = await createAttr({
          name: "Sourcing Tier",
          is_internal: true,
          values: ["A"],
        })

        const list = await api.get("/vendor/product-attributes", sellerHeaders)
        expect(list.status).toBe(200)
        const ids = list.data.product_attributes.map((a: any) => a.id)
        expect(ids).toContain(visible.id)
        expect(ids).not.toContain(hidden.id)
        expect(
          list.data.product_attributes.every(
            (a: any) => !("is_internal" in a),
          ),
        ).toBe(true)

        const forced = await api
          .get("/vendor/product-attributes?is_internal=true", sellerHeaders)
          .catch((e) => e.response)
        expect(forced.status).toBe(400)

        const detail = await api
          .get(`/vendor/product-attributes/${hidden.id}`, sellerHeaders)
          .catch((e) => e.response)
        expect(detail.status).toBe(404)

        const ok = await api.get(
          `/vendor/product-attributes/${visible.id}`,
          sellerHeaders,
        )
        expect(ok.status).toBe(200)
      })

      it("product responses omit internal attribute values set by an admin", async () => {
        const visible = await createAttr({ name: "Color", values: ["Red"] })
        const hidden = await createAttr({
          name: "Sourcing Tier",
          is_internal: true,
          values: ["A"],
        })
        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Internal Attr Product",
        })
        await attachAsAdmin(product.id, visible, "Red")
        await attachAsAdmin(product.id, hidden, "A")

        const admin = await api.get(
          `/admin/products/${product.id}`,
          adminHeaders,
        )
        expect(attributeIdsOf(admin.data.product)).toEqual(
          expect.arrayContaining([visible.id, hidden.id]),
        )
        expect(
          admin.data.product.attributes.find((a: any) => a.id === hidden.id)
            .is_internal,
        ).toBe(true)

        const detail = await api.get(
          `/vendor/products/${product.id}`,
          sellerHeaders,
        )
        expect(detail.status).toBe(200)
        expect(attributeIdsOf(detail.data.product)).toContain(visible.id)
        expect(attributeIdsOf(detail.data.product)).not.toContain(hidden.id)

        const list = await api.get("/vendor/products", sellerHeaders)
        const listed = list.data.products.find((p: any) => p.id === product.id)
        expect(listed).toBeDefined()
        expect(attributeIdsOf(listed)).not.toContain(hidden.id)
      })

      it("rejects batch add / update / remove that reference an internal attribute", async () => {
        const hidden = await createAttr({
          name: "Sourcing Tier",
          is_internal: true,
          values: ["A", "B"],
        })
        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Guarded Product",
        })
        await attachAsAdmin(product.id, hidden, "A")

        for (const body of [
          { add: [{ id: hidden.id, value_ids: [hidden.byName.get("B")!] }] },
          { update: [{ id: hidden.id, value_ids: [hidden.byName.get("B")!] }] },
          { remove: [hidden.id] },
        ]) {
          const res = await api
            .post(
              `/vendor/products/${product.id}/attributes/batch`,
              body,
              sellerHeaders,
            )
            .catch((e) => e.response)
          expect(res.status).toBe(400)
          expect(res.data.message).toContain("Sourcing Tier")
        }

        const after = await api.get(
          `/admin/products/${product.id}`,
          adminHeaders,
        )
        const kept = after.data.product.attributes.find(
          (a: any) => a.id === hidden.id,
        )
        expect(kept.values.map((v: any) => v.name)).toEqual(["A"])
      })

      it("rejects product creation that references an internal attribute", async () => {
        const hidden = await createAttr({
          name: "Sourcing Tier",
          is_internal: true,
          values: ["A"],
        })

        const res = await api
          .post(
            "/vendor/products",
            {
              title: "Blocked Product",
              status: "published",
              variants: [{ title: "Default" }],
              attributes: [
                { id: hidden.id, value_ids: [hidden.byName.get("A")!] },
              ],
            },
            sellerHeaders,
          )
          .catch((e) => e.response)
        expect(res.status).toBe(400)
        expect(res.data.message).toContain("Sourcing Tier")
      })
    })

    describe("Store - internal attributes", () => {
      let storeHeaders: { headers: Record<string, string> }

      beforeEach(async () => {
        const salesChannelModule = appContainer.resolve(Modules.SALES_CHANNEL)
        const salesChannel = await salesChannelModule.createSalesChannels({
          name: "Internal Attr Store Channel",
        })
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })
        const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
        await link.create({
          [Modules.API_KEY]: { publishable_key_id: publishableKey.id },
          [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
        })
      })

      it("attribute list and detail hide internal attributes", async () => {
        const visible = await createAttr({ name: "Color", values: ["Red"] })
        const hidden = await createAttr({
          name: "Sourcing Tier",
          is_internal: true,
          values: ["A"],
        })

        const list = await api.get("/store/product-attributes", storeHeaders)
        expect(list.status).toBe(200)
        const ids = list.data.product_attributes.map((a: any) => a.id)
        expect(ids).toContain(visible.id)
        expect(ids).not.toContain(hidden.id)

        const detail = await api
          .get(`/store/product-attributes/${hidden.id}`, storeHeaders)
          .catch((e) => e.response)
        expect(detail.status).toBe(404)
      })

      it("product detail omits internal attribute values", async () => {
        const visible = await createAttr({ name: "Color", values: ["Red"] })
        const hidden = await createAttr({
          name: "Sourcing Tier",
          is_internal: true,
          values: ["A"],
        })
        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Store Internal Attr Product",
        })
        const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
        await link.create({
          [Modules.PRODUCT]: { product_id: product.id },
          [MercurModules.SELLER]: { seller_id: seller.id },
        })
        await attachAsAdmin(product.id, visible, "Red")
        await attachAsAdmin(product.id, hidden, "A")

        const res = await api.get(`/store/products/${product.id}`, storeHeaders)
        expect(res.status).toBe(200)
        expect(attributeIdsOf(res.data.product)).toContain(visible.id)
        expect(attributeIdsOf(res.data.product)).not.toContain(hidden.id)
      })
    })
  },
})
