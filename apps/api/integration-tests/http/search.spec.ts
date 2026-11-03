import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"

import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../../integration-tests/helpers/create-admin-user"
import { createVendorProduct } from "../../../../integration-tests/helpers/create-product"
import { createSellerUser } from "../../../../integration-tests/helpers/create-seller-user"
import { createShippingProfile } from "../../../../integration-tests/helpers/create-shipping-profile"

jest.setTimeout(180000)

type SearchHit = { id: string; document: Record<string, unknown> }

const eventually = async <T>(
  read: () => Promise<T>,
  check: (value: T) => boolean,
  timeoutMs = 20000
): Promise<T> => {
  const deadline = Date.now() + timeoutMs
  let last = await read()
  while (!check(last) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    last = await read()
  }
  return last
}

medusaIntegrationTestRunner({
  env: {},
  testSuite: ({ getContainer, api }) => {
    describe("POST /store/search (product index)", () => {
      let container: MedusaContainer
      let storeHeaders: Record<string, unknown>
      let salesChannel: { id: string }
      let seedCounter = 0

      const setSellerStatus = async (sellerId: string, status: SellerStatus) => {
        const sellerModule: any = container.resolve(MercurModules.SELLER)
        await sellerModule.updateSellers({ id: sellerId, status })
      }

      const seedSellerOffer = async (opts: {
        name: string
        status: SellerStatus
        prices: { amount: number; currency_code: string }[]
        productId?: string
        variantId?: string
      }) => {
        const tag = `s${++seedCounter}${Date.now()}`
        const seller = await createSellerUser(container, {
          email: `${tag}@test.com`,
          name: opts.name,
        })
        await setSellerStatus(seller.seller.id, opts.status)
        const headers = seller.headers

        const stockLocation = (
          await api.post(`/vendor/stock-locations`, { name: `WH ${tag}` }, headers)
        ).data.stock_location
        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          headers
        )

        let { productId, variantId } = opts
        if (!productId || !variantId) {
          const product = await createVendorProduct(api, headers, {
            status: "published",
            title: `Trail Runner ${tag}`,
            sku: `SKU-${tag}`,
            attributes: [
              {
                title: `Brand ${tag}`,
                type: "single_select",
                values: ["Acme"],
                is_filterable: true,
              },
            ],
          })
          await api.post(
            `/vendor/sales-channels/${salesChannel.id}/products`,
            { add: [product.id] },
            headers
          )
          productId = product.id
          variantId = product.variants[0].id
        }

        const shippingProfile = await createShippingProfile(container, {
          name: `Profile ${tag}`,
        })
        const offer = (
          await api.post(
            `/vendor/offers`,
            {
              sku: `OFFER-${tag}`,
              variant_id: variantId,
              shipping_profile_id: shippingProfile.id,
              inventory_items: [
                {
                  title: `Inv ${tag}`,
                  required_quantity: 1,
                  stock_levels: [
                    { location_id: stockLocation.id, stocked_quantity: 10 },
                  ],
                },
              ],
              prices: opts.prices,
            },
            headers
          )
        ).data.offer

        return {
          headers,
          sellerId: seller.seller.id as string,
          sellerHandle: seller.seller.handle as string,
          productId: productId as string,
          variantId: variantId as string,
          offer,
        }
      }

      const search = async (body: Record<string, unknown>) =>
        (
          await api.post(
            `/store/search`,
            { entity: "product", ...body },
            storeHeaders
          )
        ).data.results[0] as {
          hits: SearchHit[]
          metadata: { count: number | null }
          facets?: Record<string, any>
        }

      const hitsFor = async (productId: string, extra: Record<string, unknown> = {}) =>
        eventually(
          () =>
            search({
              filters: { product_id: productId, ...extra },
              pagination: { take: 10 },
              search_options: { count: "exact" },
            }),
          (result) => result.hits.length > 0
        )

      beforeAll(() => {
        container = getContainer()
      })

      beforeEach(async () => {
        const salesChannelModule = container.resolve<ISalesChannelModuleService>(
          Modules.SALES_CHANNEL
        )
        salesChannel = await salesChannelModule.createSalesChannels({
          name: "Default Store",
        })
        const regionModule = container.resolve<IRegionModuleService>(Modules.REGION)
        await regionModule.createRegions({
          name: "Europe",
          currency_code: "eur",
          countries: ["de"],
        })

        const apiKey = await generatePublishableKey(container)
        storeHeaders = generateStoreHeaders({ publishableKey: apiKey })
        const link = container.resolve(ContainerRegistrationKeys.LINK)
        await link.create({
          [Modules.API_KEY]: { publishable_key_id: apiKey.id },
          [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
        })
      })

      it("indexes one document per currency with the cheapest open-seller price", async () => {
        const open = await seedSellerOffer({
          name: "Open Seller",
          status: SellerStatus.OPEN,
          prices: [
            { amount: 120, currency_code: "eur" },
            { amount: 130, currency_code: "usd" },
          ],
        })
        const cheaper = await seedSellerOffer({
          name: "Cheaper Seller",
          status: SellerStatus.OPEN,
          prices: [{ amount: 99, currency_code: "eur" }],
          productId: open.productId,
          variantId: open.variantId,
        })
        const suspended = await seedSellerOffer({
          name: "Suspended Seller",
          status: SellerStatus.SUSPENDED,
          prices: [{ amount: 10, currency_code: "eur" }],
          productId: open.productId,
          variantId: open.variantId,
        })

        const result = await eventually(
          () => hitsFor(open.productId),
          (r) =>
            r.hits.length === 2 &&
            r.hits.some((hit) => hit.document.min_price === 99)
        )

        expect(result.metadata.count).toEqual(2)
        const byCurrency = Object.fromEntries(
          result.hits.map((hit) => [hit.document.currency_code, hit.document])
        )
        expect(byCurrency.eur).toEqual(
          expect.objectContaining({
            id: `${open.productId}:eur`,
            product_id: open.productId,
            min_price: 99,
            seller_handles: expect.arrayContaining([
              open.sellerHandle,
              cheaper.sellerHandle,
            ]),
          })
        )
        expect(byCurrency.eur.seller_handles).not.toContain(suspended.sellerHandle)
        expect(byCurrency.usd).toEqual(
          expect.objectContaining({ min_price: 130, seller_handles: [open.sellerHandle] })
        )
        expect(byCurrency.eur.attribute_values).toEqual(
          expect.arrayContaining([expect.stringMatching(/^brand-.*:Acme$/)])
        )
      })

      it("filters by currency, price range, seller and attribute, and returns facets", async () => {
        const seed = await seedSellerOffer({
          name: "Facet Seller",
          status: SellerStatus.OPEN,
          prices: [{ amount: 250, currency_code: "eur" }],
        })
        await hitsFor(seed.productId)

        const inRange = await search({
          filters: {
            product_id: seed.productId,
            currency_code: "eur",
            $and: [
              { min_price: { $gte: 200, $lte: 300 } },
              { seller_handles: { $in: [seed.sellerHandle] } },
            ],
          },
          pagination: { take: 10 },
          search_options: {
            facets: [
              "attribute_values",
              "seller_handles",
              { field: "min_price", type: "stats" },
            ],
            count: "exact",
          },
        })
        expect(inRange.hits).toHaveLength(1)
        expect(inRange.facets?.seller_handles.values).toEqual([
          { value: seed.sellerHandle, count: 1 },
        ])
        expect(inRange.facets?.min_price).toEqual(
          expect.objectContaining({ type: "stats", min: 250, max: 250 })
        )
        const brandKey = inRange.facets?.attribute_values.values.find(
          (entry: { value: string }) => entry.value.endsWith(":Acme")
        )
        expect(brandKey).toBeDefined()

        const byAttribute = await search({
          filters: {
            product_id: seed.productId,
            currency_code: "eur",
            attribute_values: { $in: [brandKey.value] },
          },
          pagination: { take: 10 },
        })
        expect(byAttribute.hits).toHaveLength(1)

        const outOfRange = await search({
          filters: {
            product_id: seed.productId,
            currency_code: "eur",
            min_price: { $lte: 100 },
          },
          pagination: { take: 10 },
        })
        expect(outOfRange.hits).toHaveLength(0)

        const otherCurrency = await search({
          filters: { product_id: seed.productId, currency_code: "usd" },
          pagination: { take: 10 },
        })
        expect(otherCurrency.hits).toHaveLength(0)
      })

      it("drops a product's documents when its only seller is suspended", async () => {
        const seed = await seedSellerOffer({
          name: "Soon Suspended",
          status: SellerStatus.OPEN,
          prices: [{ amount: 42, currency_code: "eur" }],
        })
        await hitsFor(seed.productId)

        // The seller service emits `seller.seller.updated`, which the index
        // consumes by re-reading the seller's products.
        await setSellerStatus(seed.sellerId, SellerStatus.SUSPENDED)

        const gone = await eventually(
          () =>
            search({
              filters: { product_id: seed.productId },
              pagination: { take: 10 },
            }),
          (r) => r.hits.length === 0
        )
        expect(gone.hits).toHaveLength(0)
      })
    })
  },
})
