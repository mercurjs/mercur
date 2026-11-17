import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ProductChangeActionType } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import {
  assignProductsToSeller,
  createVendorProduct,
} from "../../../helpers/create-product"

jest.setTimeout(60000)

type Attribute = { id: string; byName: Map<string, string> }

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
        email: "variant-attr-seller@test.com",
        name: "Variant Attr Store",
      })
      seller = res.seller
      sellerHeaders = res.headers
    })

    const createAttr = async (body: Record<string, unknown>): Promise<Attribute> => {
      const res = await api.post("/admin/product-attributes", body, adminHeaders)
      const attr = res.data.product_attribute
      return {
        id: attr.id,
        byName: new Map(
          (attr.values ?? []).map((v: { id: string; name: string }) => [
            v.name,
            v.id,
          ]),
        ),
      }
    }

    const createProduct = async () => {
      const product = await createVendorProduct(api, sellerHeaders, {
        title: "Headphones",
        variants: [{ title: "Black" }, { title: "White" }],
      })
      await assignProductsToSeller(appContainer, seller.id, [product.id])
      return {
        productId: product.id,
        a: product.variants[0].id,
        b: product.variants[1].id,
      }
    }

    const batch = (productId: string, variantId: string, body: unknown) =>
      api
        .post(
          `/vendor/products/${productId}/variants/${variantId}/attributes/batch`,
          body,
          sellerHeaders,
        )
        .catch((e) => e.response)

    const attributesOf = (variant: any) =>
      Object.fromEntries(
        (variant.attributes ?? []).map((a: any) => [a.id, a]),
      ) as Record<string, { values: { id: string; name: string }[] }>

    describe("Vendor - variant attributes", () => {
      it("stages VARIANT_ATTRIBUTE_* actions and applies them on confirmation", async () => {
        const finish = await createAttr({
          name: "Finish",
          type: "single_select",
          scope: "variant",
          values: [{ name: "Matte" }, { name: "Glossy" }],
        })
        const battery = await createAttr({
          name: "Battery capacity",
          type: "unit",
          scope: "variant",
        })
        const { productId, a, b } = await createProduct()

        const added = await batch(productId, a, {
          add: [
            { id: finish.id, value_ids: [finish.byName.get("Matte")!] },
            { id: battery.id, value: "4000" },
          ],
        })
        expect(added.status).toBe(202)
        const addActions = added.data.product_change.actions
        expect(addActions).toHaveLength(2)
        expect(
          addActions.every(
            (x: any) =>
              x.action === ProductChangeActionType.VARIANT_ATTRIBUTE_ADD &&
              x.details.variant_id === a &&
              x.details.previous_value === null,
          ),
        ).toBe(true)

        // product_request is off in the test app, so the change auto-confirms
        const detailA = await api.get(
          `/vendor/products/${productId}/variants/${a}`,
          sellerHeaders,
        )
        const attrsA = attributesOf(detailA.data.variant)
        expect(attrsA[finish.id].values[0].id).toBe(finish.byName.get("Matte"))
        expect(attrsA[battery.id].values[0].name).toBe("4000")

        const detailB = await api.get(
          `/vendor/products/${productId}/variants/${b}`,
          sellerHeaders,
        )
        expect(detailB.data.variant.attributes).toEqual([])

        const updated = await batch(productId, a, {
          update: [
            { id: finish.id, value_ids: [finish.byName.get("Glossy")!] },
            { id: battery.id, value: "4000" },
          ],
          remove: [battery.id],
        })
        expect(updated.status).toBe(202)
        const actions = updated.data.product_change.actions
        const update = actions.find(
          (x: any) => x.action === ProductChangeActionType.VARIANT_ATTRIBUTE_UPDATE,
        )
        expect(update.details.previous_value.value_ids).toEqual([
          finish.byName.get("Matte"),
        ])
        const remove = actions.find(
          (x: any) => x.action === ProductChangeActionType.VARIANT_ATTRIBUTE_REMOVE,
        )
        expect(remove.details.attribute_id).toBe(battery.id)
        expect(remove.details.previous_value.value).toBe("4000")
        expect(actions).toHaveLength(2)

        const after = await api.get(
          `/vendor/products/${productId}/variants/${a}`,
          sellerHeaders,
        )
        const attrsAfter = attributesOf(after.data.variant)
        expect(Object.keys(attrsAfter)).toEqual([finish.id])
        expect(attrsAfter[finish.id].values[0].id).toBe(
          finish.byName.get("Glossy"),
        )
      })

      it("rejects internal and product-level attributes", async () => {
        const internal = await createAttr({
          name: "Sourcing tier",
          type: "text",
          scope: "variant",
          is_internal: true,
        })
        const productLevel = await createAttr({ name: "Material", type: "text" })
        const { productId, a } = await createProduct()

        const asInternal = await batch(productId, a, {
          add: [{ id: internal.id, value: "A" }],
        })
        expect(asInternal.status).toBe(400)

        const asProductLevel = await batch(productId, a, {
          add: [{ id: productLevel.id, value: "Steel" }],
        })
        expect(asProductLevel.status).toBe(400)
      })

      it("store exposes variant attributes and hides internal ones", async () => {
        const finish = await createAttr({
          name: "Finish",
          type: "single_select",
          scope: "variant",
          values: [{ name: "Matte" }],
        })
        const internal = await createAttr({
          name: "Sourcing tier",
          type: "text",
          scope: "variant",
          is_internal: true,
        })
        const { productId, a } = await createProduct()
        await batch(productId, a, {
          add: [{ id: finish.id, value_ids: [finish.byName.get("Matte")!] }],
        })
        await api.post(
          `/admin/products/${productId}/variants/${a}/attributes/batch`,
          { add: [{ id: internal.id, value: "A" }] },
          adminHeaders,
        )

        const adminDetail = await api.get(
          `/admin/products/${productId}/variants/${a}`,
          adminHeaders,
        )
        expect(Object.keys(attributesOf(adminDetail.data.variant)).sort()).toEqual(
          [finish.id, internal.id].sort(),
        )

        const vendorDetail = await api.get(
          `/vendor/products/${productId}/variants/${a}`,
          sellerHeaders,
        )
        expect(Object.keys(attributesOf(vendorDetail.data.variant))).toEqual([
          finish.id,
        ])

        const publishableKey = await generatePublishableKey(appContainer)
        const storeHeaders = generateStoreHeaders({ publishableKey })
        const store = await api.get(`/store/products/${productId}`, storeHeaders)
        expect(store.status).toBe(200)
        const variant = store.data.product.variants.find((v: any) => v.id === a)
        expect(Object.keys(attributesOf(variant))).toEqual([finish.id])
        expect(variant.attributes[0].values[0].name).toBe("Matte")
      })
    })
  },
})
