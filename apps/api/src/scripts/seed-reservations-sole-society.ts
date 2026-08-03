import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createReservationsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Seeds reservations for a specific seller (default: Sole Society /
 * seller@mercur.dev). Ensures each offer-backed inventory item has a stock
 * level, then creates a few reservations per item so the vendor Reservations
 * panel is populated with Title / SKU / Product data for that seller.
 *
 * Run: bunx medusa exec ./src/scripts/seed-reservations-sole-society.ts
 */
const TARGET_SELLER_NAME = "Sole Society"
const RESERVATIONS_PER_ITEM = 3

export default async function seedSellerReservations({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info(`Seeding reservations for "${TARGET_SELLER_NAME}"…`)

  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: [
      "id",
      "sku",
      "title",
      "seller.id",
      "seller.name",
      "location_levels.location_id",
      "location_levels.stocked_quantity",
      "location_levels.reserved_quantity",
      "offers.product.title",
    ],
    pagination: { take: 5000 },
  })

  const mine = items.filter(
    (it) =>
      (it as { seller?: { name?: string } }).seller?.name ===
      TARGET_SELLER_NAME
  )

  const offerItems = mine.filter((it) =>
    ((it as { offers?: { product?: unknown }[] }).offers ?? []).some(
      (o) => o?.product
    )
  )

  logger.info(
    `Found ${mine.length} inventory item(s) for the seller, ${offerItems.length} offer-backed.`
  )

  // A location this seller already uses (to attach stock levels where missing).
  const fallbackLocationId = mine
    .flatMap((it) => it.location_levels ?? [])
    .map((l: { location_id?: string }) => l.location_id)
    .find(Boolean)

  const reservations: {
    inventory_item_id: string
    location_id: string
    quantity: number
    description?: string
  }[] = []

  for (const item of offerItems) {
    let level = (item.location_levels ?? []).find(
      (l: { stocked_quantity?: number; reserved_quantity?: number }) =>
        (l.stocked_quantity ?? 0) - (l.reserved_quantity ?? 0) > 0
    )

    // No stock level with availability — create one so the item is reservable.
    if (!level && fallbackLocationId) {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: [
            {
              inventory_item_id: item.id as string,
              location_id: fallbackLocationId,
              stocked_quantity: 300,
            },
          ],
        },
      })
      level = {
        location_id: fallbackLocationId,
        stocked_quantity: 300,
        reserved_quantity: 0,
      }
      logger.info(`Added a stock level to ${item.sku ?? item.id}.`)
    }

    if (!level) continue

    const productTitle =
      (item as { offers?: { product?: { title?: string } }[] }).offers?.[0]
        ?.product?.title ?? item.title

    for (let n = 0; n < RESERVATIONS_PER_ITEM; n++) {
      reservations.push({
        inventory_item_id: item.id as string,
        location_id: level.location_id as string,
        quantity: 5 + n * 10, // 5, 15, 25
        description: `Reserved stock for ${productTitle}`,
      })
    }
  }

  if (!reservations.length) {
    logger.info("Nothing to seed (no offer-backed inventory items found).")
    return
  }

  await createReservationsWorkflow(container).run({
    input: { reservations },
  })

  logger.info(
    `Created ${reservations.length} reservation(s) for "${TARGET_SELLER_NAME}".`
  )
}
