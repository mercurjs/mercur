import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"

import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(60000)

/**
 * Vendor Inventory (MER-141, spec-3-vendor-inventory).
 *
 * The vendor inventory list adds a **Product** column (the master-product
 * title) — the vendor is seller-scoped, so there is NO Store column. The
 * product title is requested off `GET /vendor/inventory-items` via
 * `fields=+offers.product_variant.product.title` (item → offer → variant →
 * product; alias `offers`, memory `offer-inventory-not-on-variant`).
 *
 * These tests guard ground-rule #15: the offers/product join must resolve
 * NON-EMPTY at runtime, and the vendor list must stay seller-scoped (a vendor
 * never sees another store's items).
 */
const approveSeller = async (container: MedusaContainer, sellerId: string) => {
  const sellerModule = container.resolve(MercurModules.SELLER) as {
    updateSellers: (data: {
      id: string
      status: SellerStatus
    }) => Promise<unknown>
  }
  await sellerModule.updateSellers({ id: sellerId, status: SellerStatus.OPEN })
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Vendor - Inventory (Product column + seller scoping)", () => {
      let container: MedusaContainer
      let counter = 0

      beforeEach(async () => {
        container = getContainer()
        await createAdminUser(dbConnection, adminHeaders, container)
      })

      /**
       * Seed a seller that owns one offer-backed inventory item, mirroring the
       * production chain: seller → stock location + fulfillment + shipping
       * profile → product → offer (with an inventory item + stock level).
       * Returns the seller's id, name, headers, and the offer's sku.
       */
      const seedSellerInventory = async (opts: {
        email: string
        name: string
        productTitle: string
        offerSku: string
        stocked?: number
      }) => {
        const { seller, headers } = await createSellerUser(container, {
          email: opts.email,
          name: opts.name,
        })
        const sellerId = (seller as { id: string }).id
        await approveSeller(container, sellerId)

        const tag = `_${++counter}_${Date.now()}`

        const salesChannel = await container
          .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
          .createSalesChannels({ name: `SC${tag}` })

        const stockLocation = (
          await api.post(
            `/vendor/stock-locations`,
            { name: `WH${tag}` },
            headers
          )
        ).data.stock_location

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
          { name: `FS${tag}`, type: "shipping" },
          headers
        )
        const fulfillmentSet = (
          await api.get(
            `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
            headers
          )
        ).data.stock_location.fulfillment_sets[0]

        const serviceZone = (
          await api.post(
            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
            {
              name: `SZ${tag}`,
              geo_zones: [{ type: "country", country_code: "us" }],
            },
            headers
          )
        ).data.fulfillment_set.service_zones.find(
          (z: { name: string }) => z.name === `SZ${tag}`
        )

        const shippingProfile = (
          await api.post(
            `/vendor/shipping-profiles`,
            { name: `SP${tag}`, type: "default" },
            headers
          )
        ).data.shipping_profile

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
          { add: ["manual_manual"] },
          headers
        )
        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          headers
        )
        await api.post(
          `/vendor/shipping-options`,
          {
            name: `Ship${tag}`,
            service_zone_id: serviceZone.id,
            shipping_profile_id: shippingProfile.id,
            provider_id: "manual_manual",
            price_type: "flat",
            type: {
              label: "Standard",
              description: "Standard",
              code: "standard",
            },
            prices: [{ currency_code: "usd", amount: 500 }],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
            ],
          },
          headers
        )

        const product = await createVendorProduct(api, headers, {
          title: opts.productTitle,
          sku: `V${tag}`,
        })
        await api.post(
          `/vendor/sales-channels/${salesChannel.id}/products`,
          { add: [product.id] },
          headers
        )

        await api.post(
          `/vendor/offers`,
          {
            sku: opts.offerSku,
            variant_id: product.variants[0].id,
            shipping_profile_id: shippingProfile.id,
            inventory_items: [
              {
                sku: opts.offerSku,
                title: opts.productTitle,
                required_quantity: 1,
                stock_levels: [
                  {
                    location_id: stockLocation.id,
                    stocked_quantity: opts.stocked ?? 100,
                  },
                ],
              },
            ],
            prices: [{ amount: 1000, currency_code: "usd" }],
          },
          headers
        )

        return { sellerId, sellerName: opts.name, headers, offerSku: opts.offerSku }
      }

      it("resolves the Product column via the offer's variant product, plus stock quantities", async () => {
        const { headers, offerSku } = await seedSellerInventory({
          email: "vinv-product@medusa.js",
          name: "Vendor Store One",
          productTitle: "A-Line Dress",
          offerSku: "V-OF-1",
          stocked: 100,
        })

        const res = await api.get(
          `/vendor/inventory-items?fields=id,sku,stocked_quantity,reserved_quantity,+offers.product_variant.product.title`,
          headers
        )
        expect(res.status).toEqual(200)

        const item = (
          res.data.inventory_items as Array<{
            sku?: string
            stocked_quantity?: number
            reserved_quantity?: number
            offers?: Array<{
              product_variant?: { product?: { title?: string } }
            }>
          }>
        ).find((i) => i.sku === offerSku)

        expect(item).toBeDefined()
        // Product column reads offers[0].product_variant.product.title
        expect(item!.offers?.[0]?.product_variant?.product?.title).toEqual(
          "A-Line Dress"
        )
        // In stock / Reserved columns read the server accessors
        expect(item!.stocked_quantity).toEqual(100)
        expect(item!.reserved_quantity).toEqual(0)
      })

      it("scopes the vendor list to the caller's own store", async () => {
        const a = await seedSellerInventory({
          email: "vinv-a@medusa.js",
          name: "Vendor Store A",
          productTitle: "Prod A",
          offerSku: "V-OF-A",
        })
        const b = await seedSellerInventory({
          email: "vinv-b@medusa.js",
          name: "Vendor Store B",
          productTitle: "Prod B",
          offerSku: "V-OF-B",
        })

        const res = await api.get(
          `/vendor/inventory-items?fields=id,sku`,
          a.headers
        )
        expect(res.status).toEqual(200)

        const skus = new Set(
          (res.data.inventory_items as Array<{ sku?: string }>).map(
            (i) => i.sku
          )
        )
        // Seller A sees its own item...
        expect(skus.has(a.offerSku)).toBe(true)
        // ...but never seller B's.
        expect(skus.has(b.offerSku)).toBe(false)
      })
    })
  },
})
