import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createOffersWorkflow } from "@mercurjs/core/workflows"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

const VARIANT_ATTRIBUTES = {
  weight: 1000,
  length: 20,
  width: 10,
  height: 30,
  hs_code: "610910",
  origin_country: "pl",
  mid_code: "PLMID123",
  material: "cotton",
}

const ATTRIBUTE_FIELDS = Object.keys(VARIANT_ATTRIBUTES)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("createOffersWorkflow - inventory item attributes", () => {
      let appContainer: MedusaContainer

      beforeAll(() => {
        appContainer = getContainer()
      })

      const setup = async () => {
        const tag = `t${Date.now()}${Math.floor(Math.random() * 1000)}`
        const { seller, member, headers } = await createSellerUser(
          appContainer,
          { email: `attrs-${tag}@test.com`, name: "Attrs Seller" }
        )

        const stockLocation = (
          await api.post(
            `/vendor/stock-locations`,
            { name: `WH ${tag}` },
            headers
          )
        ).data.stock_location

        const shippingProfile = await createShippingProfile(appContainer, {
          name: `Profile ${tag}`,
        })

        const product = await createVendorProduct(api, headers, {
          title: `Attrs Product ${tag}`,
          variants: [{ title: `Attrs Variant ${tag}` }],
        })

        const variant = product.variants[0]

        const offerInput = (
          inventoryItems: Array<{ sku: string; required_quantity?: number }>
        ) => ({
          seller_id: seller.id,
          created_by: member.id,
          variant_id: variant.id,
          shipping_profile_id: shippingProfile.id,
          sku: `OFFER-${tag}`,
          inventory_items: inventoryItems.map((item) => ({
            ...item,
            stock_levels: [
              { location_id: stockLocation.id, stocked_quantity: 10 },
            ],
          })),
          prices: [{ amount: 1000, currency_code: "usd" }],
        })

        return { tag, variant, offerInput }
      }

      const getOfferInventoryItems = async (offerId: string) => {
        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "offer",
          fields: ATTRIBUTE_FIELDS.map((f) => `inventory_items.${f}`).concat(
            "inventory_items.id"
          ),
          filters: { id: offerId },
        })
        return (data[0]?.inventory_items ?? []) as Array<
          Record<string, unknown>
        >
      }

      it("copies the variant's shipping and customs attributes onto a single-item offer inventory item", async () => {
        const { tag, variant, offerInput } = await setup()

        await appContainer
          .resolve(Modules.PRODUCT)
          .updateProductVariants(variant.id, VARIANT_ATTRIBUTES)

        const { result } = await createOffersWorkflow(appContainer).run({
          input: { offers: [offerInput([{ sku: `INV-${tag}` }])] },
        })

        const items = await getOfferInventoryItems(result[0].id)

        expect(items).toHaveLength(1)
        expect(items[0]).toEqual(expect.objectContaining(VARIANT_ATTRIBUTES))
      })

      it("does not copy the variant's attributes onto kit offer inventory items", async () => {
        const { tag, variant, offerInput } = await setup()

        await appContainer
          .resolve(Modules.PRODUCT)
          .updateProductVariants(variant.id, VARIANT_ATTRIBUTES)

        const { result } = await createOffersWorkflow(appContainer).run({
          input: {
            offers: [
              offerInput([
                { sku: `INV-A-${tag}` },
                { sku: `INV-B-${tag}`, required_quantity: 2 },
              ]),
            ],
          },
        })

        const items = await getOfferInventoryItems(result[0].id)

        expect(items).toHaveLength(2)
        for (const item of items) {
          for (const field of ATTRIBUTE_FIELDS) {
            expect(item[field]).toBeNull()
          }
        }
      })

      it("does not copy the variant's attributes when the single item has a required quantity above one", async () => {
        const { tag, variant, offerInput } = await setup()

        await appContainer
          .resolve(Modules.PRODUCT)
          .updateProductVariants(variant.id, VARIANT_ATTRIBUTES)

        const { result } = await createOffersWorkflow(appContainer).run({
          input: {
            offers: [offerInput([{ sku: `INV-${tag}`, required_quantity: 3 }])],
          },
        })

        const items = await getOfferInventoryItems(result[0].id)

        expect(items).toHaveLength(1)
        for (const field of ATTRIBUTE_FIELDS) {
          expect(items[0][field]).toBeNull()
        }
      })

      it("leaves attributes empty when the variant has none", async () => {
        const { tag, offerInput } = await setup()

        const { result } = await createOffersWorkflow(appContainer).run({
          input: { offers: [offerInput([{ sku: `INV-${tag}` }])] },
        })

        const items = await getOfferInventoryItems(result[0].id)

        expect(items).toHaveLength(1)
        for (const field of ATTRIBUTE_FIELDS) {
          expect(items[0][field]).toBeNull()
        }
      })
    })
  },
})
