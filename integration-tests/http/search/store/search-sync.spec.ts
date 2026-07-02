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
import {
  offersForSeller,
  reindexProductsById,
  removeOfferDocs,
  removeProductAndOffers,
} from "@mercurjs/core/modules/search"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"

const setSellerStatus = async (
  container: MedusaContainer,
  sellerId: string,
  status: SellerStatus
) => {
  const sellerModule = container.resolve(MercurModules.SELLER)
  await (
    sellerModule as { updateSellers: (input: unknown) => Promise<unknown> }
  ).updateSellers({ id: sellerId, status })
}

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Store - Search incremental sync", () => {
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
          await setSellerStatus(appContainer, result.seller.id, SellerStatus.OPEN)
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
          offer,
        }
      }

      const searchHits = async (q: string) => {
        const response = await api.post(
          `/store/search`,
          { q, region_id: region.id },
          storeHeaders
        )
        expect(response.status).toEqual(200)
        return response.data.hits as {
          type: string
          id: string
          calculated_price?: { calculated_amount: number }
        }[]
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

      it("reindexProductsById indexes a published product and its offer", async () => {
        const seed = await seedSellerOffer({
          email: "sync-index@test.com",
          name: "SyncIndex",
          offerPrice: 2500,
        })

        await reindexProductsById(appContainer, [seed.productId])

        const hits = await searchHits("SyncIndex")
        const productHit = hits.find(
          (h) => h.type === "product" && h.id === seed.productId
        )
        const offerHit = hits.find(
          (h) => h.type === "offer" && h.id === seed.offer.id
        )
        expect(productHit?.calculated_price?.calculated_amount).toEqual(2500)
        expect(offerHit?.calculated_price?.calculated_amount).toEqual(2500)
      })

      it("removeProductAndOffers drops the product and its offer docs", async () => {
        const seed = await seedSellerOffer({
          email: "sync-delete@test.com",
          name: "SyncDelete",
          offerPrice: 1800,
        })
        await reindexProductsById(appContainer, [seed.productId])

        await removeProductAndOffers(appContainer, [seed.productId])

        const hits = await searchHits("SyncDelete")
        expect(hits.find((h) => h.id === seed.productId)).toBeFalsy()
        expect(hits.find((h) => h.id === seed.offer.id)).toBeFalsy()
      })

      it("suspending a seller drops its offer doc but keeps the product", async () => {
        const seed = await seedSellerOffer({
          email: "sync-suspend@test.com",
          name: "SyncSuspend",
          offerPrice: 3000,
        })
        await reindexProductsById(appContainer, [seed.productId])

        await setSellerStatus(appContainer, seed.sellerId, SellerStatus.SUSPENDED)

        const { offerIds, productIds } = await offersForSeller(
          appContainer,
          seed.sellerId
        )
        await removeOfferDocs(appContainer, offerIds)
        await reindexProductsById(appContainer, productIds)

        const hits = await searchHits("SyncSuspend")
        expect(
          hits.find((h) => h.type === "offer" && h.id === seed.offer.id)
        ).toBeFalsy()
        expect(
          hits.find((h) => h.type === "product" && h.id === seed.productId)
        ).toBeTruthy()
      })

      it("deleting an offer removes its doc and recomputes the product", async () => {
        const seed = await seedSellerOffer({
          email: "sync-offer-delete@test.com",
          name: "SyncOfferDelete",
          offerPrice: 2100,
        })
        await reindexProductsById(appContainer, [seed.productId])

        const offerModule = appContainer.resolve(MercurModules.OFFER)
        await (
          offerModule as { deleteOffers: (ids: string[]) => Promise<unknown> }
        ).deleteOffers([seed.offer.id])

        await removeOfferDocs(appContainer, [seed.offer.id])
        await reindexProductsById(appContainer, [seed.productId])

        const hits = await searchHits("SyncOfferDelete")
        expect(
          hits.find((h) => h.type === "offer" && h.id === seed.offer.id)
        ).toBeFalsy()
        expect(
          hits.find((h) => h.type === "product" && h.id === seed.productId)
        ).toBeTruthy()
      })
    })
  },
})
