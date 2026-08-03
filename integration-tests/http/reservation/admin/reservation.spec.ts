import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createVendorProduct } from "../../../helpers/create-product"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(180000)

/**
 * Covers the Mercur admin `/admin/reservations` override
 * (`packages/core/src/api/admin/reservations`): it extends the native route so
 * the list exposes the owning store and the product behind each reservation's
 * inventory item, and adds the `sku` + `seller_id` filters the Figma list uses.
 *
 * Data path under test:
 *   reservation -> inventory_item -> seller          (inventory-item-seller-link)
 *   reservation -> inventory_item -> offers -> product (offer-product-link)
 */

const approveSeller = async (
  container: MedusaContainer,
  sellerId: string
) => {
  const sellerModule: any = container.resolve(MercurModules.SELLER)
  await sellerModule.updateSellers({ id: sellerId, status: SellerStatus.OPEN })
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Reservations list (store/product joins + filters)", () => {
      let appContainer: MedusaContainer
      let salesChannel: any
      let counter = 0

      const seedSellerReservation = async (opts: {
        email: string
        name: string
        stocked: number
      }) => {
        const { seller, headers } = await createSellerUser(appContainer, {
          email: opts.email,
          name: opts.name,
        })
        await approveSeller(appContainer, (seller as any).id)
        const tag = `_${opts.name}_${Date.now()}_${++counter}`

        const stockLocation = (
          await api.post(
            `/vendor/stock-locations`,
            { name: `Warehouse${tag}` },
            headers
          )
        ).data.stock_location

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          headers
        )

        const shippingProfile = (
          await api.post(
            `/vendor/shipping-profiles`,
            { name: `SP${tag}`, type: "default" },
            headers
          )
        ).data.shipping_profile

        // The offer flow now titles the inventory item after the variant, so
        // give the variant the unique tag to keep the lookup below stable.
        const product = await createVendorProduct(api, headers, {
          title: `Prod${tag}`,
          sku: `V${tag}`,
          variantTitle: `Inv${tag}`,
        })

        await api.post(
          `/vendor/offers`,
          {
            sku: `OF${tag}`,
            variant_id: product.variants[0].id,
            shipping_profile_id: shippingProfile.id,
            inventory_items: [
              {
                title: `Inv${tag}`,
                sku: `SKU${tag}`,
                required_quantity: 1,
                stock_levels: [
                  {
                    location_id: stockLocation.id,
                    stocked_quantity: opts.stocked,
                  },
                ],
              },
            ],
            prices: [{ amount: 1000, currency_code: "usd" }],
          },
          headers
        )

        // Resolve the inventory item created for the offer + its sku.
        const inventoryItem = (
          await api.get(
            `/admin/inventory-items?q=Inv${tag}`,
            adminHeaders
          )
        ).data.inventory_items[0]

        const reservation = (
          await api.post(
            `/admin/reservations`,
            {
              inventory_item_id: inventoryItem.id,
              location_id: stockLocation.id,
              quantity: 1,
            },
            adminHeaders
          )
        ).data.reservation

        return {
          sellerId: (seller as any).id,
          product,
          stockLocation,
          inventoryItem,
          reservation,
        }
      }

      let sellerA: Awaited<ReturnType<typeof seedSellerReservation>>
      let sellerB: Awaited<ReturnType<typeof seedSellerReservation>>

      beforeAll(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const regionModule: IRegionModuleService = appContainer.resolve(
          Modules.REGION
        )
        await regionModule.createRegions({
          name: "US",
          currency_code: "usd",
          countries: ["us"],
        })

        const scModule: ISalesChannelModuleService = appContainer.resolve(
          Modules.SALES_CHANNEL
        )
        salesChannel = await scModule.createSalesChannels({
          name: `SC_${Date.now()}`,
        })

        sellerA = await seedSellerReservation({
          email: "res-a@test.com",
          name: "StoreA",
          stocked: 100,
        })
        sellerB = await seedSellerReservation({
          email: "res-b@test.com",
          name: "StoreB",
          stocked: 100,
        })
      })

      it("returns the store (seller) and product joins for each reservation", async () => {
        const response = await api.get(`/admin/reservations`, adminHeaders)
        expect(response.status).toBe(200)

        const row = response.data.reservations.find(
          (r: any) => r.id === sellerA.reservation.id
        )

        expect(row).toBeTruthy()
        expect(row.inventory_item).toBeTruthy()
        expect(row.inventory_item.sku).toEqual(sellerA.inventoryItem.sku)
        expect(row.inventory_item.seller?.id).toEqual(sellerA.sellerId)
        expect(row.inventory_item.seller?.name).toEqual("StoreA")
        expect(row.inventory_item.offers?.[0]?.product?.id).toEqual(
          sellerA.product.id
        )
      })

      it("filters by sku", async () => {
        const sku = sellerA.inventoryItem.sku
        const response = await api.get(
          `/admin/reservations?sku=${encodeURIComponent(sku)}`,
          adminHeaders
        )

        expect(response.status).toBe(200)
        expect(response.data.reservations.length).toBeGreaterThan(0)
        for (const r of response.data.reservations) {
          expect(r.inventory_item.sku).toEqual(sku)
        }
        expect(
          response.data.reservations.some(
            (r: any) => r.id === sellerB.reservation.id
          )
        ).toBe(false)
      })

      it("filters by seller_id (store)", async () => {
        const response = await api.get(
          `/admin/reservations?seller_id=${sellerA.sellerId}`,
          adminHeaders
        )

        expect(response.status).toBe(200)
        expect(
          response.data.reservations.some(
            (r: any) => r.id === sellerA.reservation.id
          )
        ).toBe(true)
        expect(
          response.data.reservations.some(
            (r: any) => r.id === sellerB.reservation.id
          )
        ).toBe(false)
      })

      it("sorts by created_at", async () => {
        const response = await api.get(
          `/admin/reservations?order=-created_at`,
          adminHeaders
        )

        expect(response.status).toBe(200)
        const dates = response.data.reservations.map((r: any) =>
          new Date(r.created_at).getTime()
        )
        const sorted = [...dates].sort((a, b) => b - a)
        expect(dates).toEqual(sorted)
      })
    })
  },
})
