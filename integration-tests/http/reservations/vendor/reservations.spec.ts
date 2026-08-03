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
 * Vendor Reservations — seller scoping (MER-141).
 *
 * Reservations have no direct reservation↔seller link; a reservation belongs to
 * a seller only through its inventory item (`inventory_item_seller`). The vendor
 * reservation middlewares scope every route to the caller's own inventory items.
 * These tests guard that a vendor can never see, delete, or create a reservation
 * against another store's inventory.
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
    describe("Vendor - Reservations (seller scoping)", () => {
      let container: MedusaContainer
      let counter = 0

      beforeEach(async () => {
        container = getContainer()
        await createAdminUser(dbConnection, adminHeaders, container)
      })

      // Seed a seller that owns one offer-backed inventory item with stock, then
      // return everything needed to create/inspect its reservations.
      const seedSellerWithReservation = async (opts: {
        email: string
        name: string
        offerSku: string
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
          await api.post(`/vendor/stock-locations`, { name: `WH${tag}` }, headers)
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
          title: `Prod${tag}`,
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
                title: `Item${tag}`,
                required_quantity: 1,
                stock_levels: [
                  { location_id: stockLocation.id, stocked_quantity: 100 },
                ],
              },
            ],
            prices: [{ amount: 1000, currency_code: "usd" }],
          },
          headers
        )

        // Resolve the seller's own inventory item + create a reservation on it.
        const item = (
          await api.get(`/vendor/inventory-items?sku=${opts.offerSku}`, headers)
        ).data.inventory_items[0]

        const reservation = (
          await api.post(
            `/vendor/reservations`,
            {
              inventory_item_id: item.id,
              location_id: stockLocation.id,
              quantity: 2,
            },
            headers
          )
        ).data.reservation

        return { sellerId, headers, itemId: item.id, reservationId: reservation.id }
      }

      it("lists only the caller's own reservations", async () => {
        const a = await seedSellerWithReservation({
          email: "resv-a@medusa.js",
          name: "Resv Store A",
          offerSku: "RESV-OF-A",
        })
        await seedSellerWithReservation({
          email: "resv-b@medusa.js",
          name: "Resv Store B",
          offerSku: "RESV-OF-B",
        })

        const res = await api.get(`/vendor/reservations`, a.headers)
        expect(res.status).toEqual(200)

        const itemIds = new Set(
          (res.data.reservations as Array<{ inventory_item_id: string }>).map(
            (r) => r.inventory_item_id
          )
        )
        // Seller A sees only its own item's reservation, nothing from B.
        expect(itemIds.has(a.itemId)).toBe(true)
        expect(itemIds.size).toBe(1)
        expect(res.data.count).toBe(1)
      })

      it("resolves the product behind each reservation's inventory item", async () => {
        const a = await seedSellerWithReservation({
          email: "resv-p@medusa.js",
          name: "Resv Store P",
          offerSku: "RESV-OF-P",
        })

        const res = await api.get(`/vendor/reservations`, a.headers)
        expect(res.status).toEqual(200)

        const row = (
          res.data.reservations as Array<{
            inventory_item_id: string
            inventory_item?: {
              sku?: string
              offers?: Array<{ product?: { id?: string; title?: string } }>
            }
          }>
        ).find((r) => r.inventory_item_id === a.itemId)

        expect(row?.inventory_item?.sku).toBe("RESV-OF-P")
        // Product column data must resolve through the offer link.
        expect(row?.inventory_item?.offers?.[0]?.product?.id).toBeTruthy()
        expect(row?.inventory_item?.offers?.[0]?.product?.title).toBeTruthy()
      })

      it("filters the list by sku, scoped to the caller", async () => {
        const a = await seedSellerWithReservation({
          email: "resv-g@medusa.js",
          name: "Resv Store G",
          offerSku: "RESV-OF-G",
        })
        await seedSellerWithReservation({
          email: "resv-h@medusa.js",
          name: "Resv Store H",
          offerSku: "RESV-OF-H",
        })

        // A's own sku returns A's reservation.
        const match = await api.get(
          `/vendor/reservations?sku=RESV-OF-G`,
          a.headers
        )
        expect(match.status).toEqual(200)
        expect(match.data.count).toBe(1)
        expect(match.data.reservations[0].inventory_item_id).toBe(a.itemId)

        // B's sku, queried by A, never leaks B's reservation.
        const leak = await api.get(
          `/vendor/reservations?sku=RESV-OF-H`,
          a.headers
        )
        expect(leak.status).toEqual(200)
        expect(leak.data.count).toBe(0)
      })

      it("returns empty when filtering by another seller's inventory item", async () => {
        const a = await seedSellerWithReservation({
          email: "resv-c@medusa.js",
          name: "Resv Store C",
          offerSku: "RESV-OF-C",
        })
        const b = await seedSellerWithReservation({
          email: "resv-d@medusa.js",
          name: "Resv Store D",
          offerSku: "RESV-OF-D",
        })

        const res = await api.get(
          `/vendor/reservations?inventory_item_id=${b.itemId}`,
          a.headers
        )
        expect(res.status).toEqual(200)
        expect(res.data.count).toBe(0)
      })

      it("blocks reading, deleting, and creating against another seller's reservation/item", async () => {
        const a = await seedSellerWithReservation({
          email: "resv-e@medusa.js",
          name: "Resv Store E",
          offerSku: "RESV-OF-E",
        })
        const b = await seedSellerWithReservation({
          email: "resv-f@medusa.js",
          name: "Resv Store F",
          offerSku: "RESV-OF-F",
        })

        // A cannot read B's reservation by id.
        await expect(
          api.get(`/vendor/reservations/${b.reservationId}`, a.headers)
        ).rejects.toMatchObject({ response: { status: 404 } })

        // A cannot delete B's reservation.
        await expect(
          api.delete(`/vendor/reservations/${b.reservationId}`, a.headers)
        ).rejects.toMatchObject({ response: { status: 404 } })

        // A cannot create a reservation against B's inventory item.
        await expect(
          api.post(
            `/vendor/reservations`,
            { inventory_item_id: b.itemId, location_id: b.itemId, quantity: 1 },
            a.headers
          )
        ).rejects.toMatchObject({ response: { status: expect.any(Number) } })

        // B's reservation still exists (A's failed calls didn't touch it).
        const stillThere = await api.get(
          `/vendor/reservations/${b.reservationId}`,
          b.headers
        )
        expect(stillThere.status).toEqual(200)
      })
    })
  },
})
