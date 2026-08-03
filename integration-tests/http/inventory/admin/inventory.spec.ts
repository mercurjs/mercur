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
 * Admin Inventory (MER-139, spec-3-admin-inventory).
 *
 * The admin inventory list adds two marketplace columns to Medusa's native
 * table — **Store** (the seller that owns the item) and **Product** (the
 * product title). Both come from the mercur links, requested off the native
 * `GET /admin/inventory-items` route via `fields`:
 *   - Store   → `+seller.name`          (inventory_item ↔ seller link)
 *   - Product → `+offers.product_variant.product.title` (item → offer → variant → product)
 *
 * IMPORTANT (memory `offer-inventory-not-on-variant`, decision D1): seller
 * inventory is created through an **offer** and links to the *offer*, not the
 * variant — so `inventory_item.variants` is empty. The Product column reaches
 * the title through the offer (`offers.product.title`), inventory-side alias
 * `offers`.
 *
 * `seller_id` filtering (the list's "Store" filter) is NOT in the native
 * validator, so the last test specifies the behavior the core route override
 * (delta D-03, backend) still has to deliver — it is expected red until then.
 */
const approveSeller = async (container: MedusaContainer, sellerId: string) => {
  const sellerModule = container.resolve(MercurModules.SELLER) as {
    updateSellers: (data: { id: string; status: SellerStatus }) => Promise<unknown>
  }
  await sellerModule.updateSellers({ id: sellerId, status: SellerStatus.OPEN })
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Inventory (marketplace columns)", () => {
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
       * Returns the seller and the inventory item's sku.
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
            type: { label: "Standard", description: "Standard", code: "standard" },
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

        return { sellerId, sellerName: opts.name, offerSku: opts.offerSku }
      }

      const listItemForSeller = async (sellerId: string) => {
        const res = await api.get(
          `/admin/inventory-items?fields=id,sku,*seller,offers.id,offers.sku,offers.product_variant.title,offers.product_variant.product.title`,
          adminHeaders
        )
        expect(res.status).toEqual(200)
        return (res.data.inventory_items as Array<{ seller?: { id: string } }>).find(
          (i) => i.seller?.id === sellerId
        )
      }

      it("resolves the Store (seller) column via the seller link", async () => {
        const { sellerId, sellerName } = await seedSellerInventory({
          email: "inv-store@medusa.js",
          name: "Store One",
          productTitle: "Tennis Dress",
          offerSku: "OF-STORE-1",
        })

        const item = (await listItemForSeller(sellerId)) as
          | { seller?: { id: string; name: string } }
          | undefined

        expect(item).toBeDefined()
        expect(item!.seller!.name).toEqual(sellerName)
      })

      it("resolves the Product column via the offer's variant product", async () => {
        const { sellerId } = await seedSellerInventory({
          email: "inv-offer@medusa.js",
          name: "Store Two",
          productTitle: "A-Line Dress",
          offerSku: "OF-STORE-2",
        })

        const item = (await listItemForSeller(sellerId)) as
          | {
              offers?: Array<{
                product_variant?: { product?: { title?: string } }
              }>
            }
          | undefined

        expect(item).toBeDefined()
        // Product column reads offers[0].product_variant.product.title
        expect(
          item!.offers?.[0]?.product_variant?.product?.title
        ).toEqual("A-Line Dress")
      })

      // Specifies delta D-03 (backend). The list "Store" filter sends
      // `seller_id`, which the native validator drops today. When the core
      // admin `inventory-items` route override lands, this must scope the list
      // to the given seller. Expected RED until then — that red is the signal.
      it("filters the list by seller_id (Store filter)", async () => {
        const a = await seedSellerInventory({
          email: "inv-a@medusa.js",
          name: "Store A",
          productTitle: "Prod A",
          offerSku: "OF-A",
        })
        await seedSellerInventory({
          email: "inv-b@medusa.js",
          name: "Store B",
          productTitle: "Prod B",
          offerSku: "OF-B",
        })

        const res = await api.get(
          `/admin/inventory-items?seller_id=${a.sellerId}&fields=id,sku,*seller`,
          adminHeaders
        )
        expect(res.status).toEqual(200)

        const sellerIds = new Set(
          (res.data.inventory_items as Array<{ seller?: { id: string } }>).map(
            (i) => i.seller?.id
          )
        )
        expect(sellerIds.has(a.sellerId)).toBe(true)
        expect(sellerIds.size).toBe(1)
      })
    })
  },
})
