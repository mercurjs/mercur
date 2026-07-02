import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"
import { reindexAll } from "@mercurjs/core/modules/search"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

const approveSeller = async (container: MedusaContainer, sellerId: string) => {
  const sellerModule = container.resolve(MercurModules.SELLER)
  await (sellerModule as { updateSellers: (input: unknown) => Promise<unknown> }).updateSellers(
    {
      id: sellerId,
      status: SellerStatus.OPEN,
    }
  )
}

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Store - Search (search-orama)", () => {
      let appContainer: MedusaContainer
      let storeHeaders: ReturnType<typeof generateStoreHeaders>
      let region: { id: string }
      let salesChannel: { id: string }
      let seedCounter = 0

      const seedSellerOffer = async (opts: {
        email: string
        name: string
        offerPrice: number
        approve?: boolean
        published?: boolean
      }) => {
        const tag = `s${++seedCounter}${Date.now()}`
        const result = await createSellerUser(appContainer, {
          email: opts.email,
          name: opts.name,
        })
        if (opts.approve !== false) {
          await approveSeller(appContainer, result.seller.id)
        }
        const headers = result.headers

        const stockLocation = (
          await api.post(
            `/vendor/stock-locations`,
            { name: `${opts.name} WH ${tag}` },
            headers
          )
        ).data.stock_location

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          headers
        )

        const product = await createVendorProduct(api, headers, {
          status: opts.published === false ? "draft" : "published",
          title: `${opts.name} Product ${tag}`,
          sku: `${opts.email}-V-SKU-${tag}`,
        })

        await api.post(
          `/vendor/sales-channels/${salesChannel.id}/products`,
          { add: [product.id] },
          headers
        )

        const shippingProfile = (
          await api.post(
            `/vendor/shipping-profiles`,
            { name: `${opts.name} Profile ${tag}`, type: "default" },
            headers
          )
        ).data.shipping_profile

        const offer = (
          await api.post(
            `/vendor/offers`,
            {
              sku: `${opts.name.replace(/\s/g, "")}-OFFER-${tag}`,
              variant_id: product.variants[0].id,
              shipping_profile_id: shippingProfile.id,
              inventory_items: [
                {
                  title: `${opts.name} Inv ${tag}`,
                  required_quantity: 1,
                  stock_levels: [
                    { location_id: stockLocation.id, stocked_quantity: 10 },
                  ],
                },
              ],
              prices: [{ amount: opts.offerPrice, currency_code: "usd" }],
            },
            headers
          )
        ).data.offer

        return {
          headers,
          sellerId: result.seller.id as string,
          productId: product.id as string,
          title: product.title as string,
          offer,
        }
      }

      const reindex = async () => {
        // Synchronous full reindex via `reindexAll` (calls `search.index`
        // directly) — awaited, so tests never race the async boot path.
        await reindexAll(appContainer)
      }

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const salesChannelModule =
          appContainer.resolve<ISalesChannelModuleService>(
            Modules.SALES_CHANNEL
          )
        salesChannel = await salesChannelModule.createSalesChannels({
          name: "Default Store",
        })

        const regionModule = appContainer.resolve<IRegionModuleService>(
          Modules.REGION
        )
        region = await regionModule.createRegions({
          name: "Test Region",
          currency_code: "usd",
          countries: ["us"],
        })

        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })

        const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
        await link.create({
          [Modules.API_KEY]: { publishable_key_id: apiKey.id },
          [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
        })
      })

      describe("POST /store/search", () => {
        it("returns a published product and its offer after reindex, priced per region", async () => {
          const seed = await seedSellerOffer({
            email: "search-happy@test.com",
            name: "Searchable",
            offerPrice: 2500,
          })

          await reindex()

          const response = await api.post(
            `/store/search`,
            {
              q: "Searchable",
              region_id: region.id,
            },
            storeHeaders
          )

          expect(response.status).toEqual(200)

          const productHit = response.data.hits.find(
            (h: { type: string; id: string }) =>
              h.type === "product" && h.id === seed.productId
          )
          expect(productHit).toBeTruthy()
          expect(productHit.calculated_price?.calculated_amount).toEqual(2500)

          const offerHit = response.data.hits.find(
            (h: { type: string; id: string }) =>
              h.type === "offer" && h.id === seed.offer.id
          )
          expect(offerHit).toBeTruthy()
          expect(offerHit.calculated_price?.calculated_amount).toEqual(2500)
        })

        it("omits draft products from results", async () => {
          const seed = await seedSellerOffer({
            email: "search-draft@test.com",
            name: "Hidden",
            offerPrice: 1500,
            published: false,
          })

          await reindex()

          const response = await api.post(
            `/store/search`,
            { q: "Hidden", region_id: region.id },
            storeHeaders
          )

          expect(response.status).toEqual(200)
          const hit = response.data.hits.find(
            (h: { id: string }) => h.id === seed.productId
          )
          expect(hit).toBeFalsy()
        })

        it("excludes suspended-seller content at index time", async () => {
          const seed = await seedSellerOffer({
            email: "search-suspended@test.com",
            name: "Suspended",
            offerPrice: 3000,
          })

          const sellerModule = appContainer.resolve(MercurModules.SELLER)
          await (
            sellerModule as {
              updateSellers: (input: unknown) => Promise<unknown>
            }
          ).updateSellers({
            id: seed.sellerId,
            status: SellerStatus.SUSPENDED,
          })

          await reindex()

          const response = await api.post(
            `/store/search`,
            { q: "Suspended", region_id: region.id },
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.hits.find((h: { id: string }) => h.id === seed.productId)
          ).toBeFalsy()
        })
      })
    })
  },
})
