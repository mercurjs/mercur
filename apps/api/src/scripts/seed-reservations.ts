import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createReservationsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Seeds a handful of manual reservations against sellers' existing
 * offer-backed inventory items so the vendor Reservations panel has data with
 * populated Title / SKU / Product columns.
 *
 * Run: bunx medusa exec ./src/scripts/seed-reservations.ts
 */
export default async function seedReservations({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Seeding demo reservations…")

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
    pagination: { take: 500 },
  })

  // Items already carrying a reservation — skip them so re-runs stay idempotent.
  const { data: existing } = await query.graph({
    entity: "reservation",
    fields: ["id", "inventory_item_id"],
    pagination: { take: 1000 },
  })
  const alreadyReserved = new Set(
    existing.map((r) => r.inventory_item_id as string)
  )

  const MAX_PER_SELLER = 5
  const perSeller = new Map<string, number>()
  const input: {
    inventory_item_id: string
    location_id: string
    quantity: number
    description?: string
  }[] = []

  for (const item of items) {
    const sellerId = (item as { seller?: { id?: string } }).seller?.id
    if (!sellerId) continue
    if (alreadyReserved.has(item.id as string)) continue

    const level = (item.location_levels ?? []).find(
      (l: { stocked_quantity?: number; reserved_quantity?: number }) =>
        (l.stocked_quantity ?? 0) - (l.reserved_quantity ?? 0) > 0
    )
    if (!level) continue

    const used = perSeller.get(sellerId) ?? 0
    if (used >= MAX_PER_SELLER) continue
    perSeller.set(sellerId, used + 1)

    const productTitle =
      (item as { offers?: { product?: { title?: string } }[] }).offers?.[0]
        ?.product?.title
    const quantity = 3 + ((input.length % 5) * 2) // 3,5,7,9,11,3,…

    input.push({
      inventory_item_id: item.id as string,
      location_id: level.location_id as string,
      quantity,
      description: productTitle
        ? `Reserved stock for ${productTitle}`
        : `Reserved stock for ${item.title ?? item.sku ?? item.id}`,
    })
  }

  if (!input.length) {
    logger.info(
      "No un-reserved offer-backed inventory items found — nothing to seed."
    )
    return
  }

  await createReservationsWorkflow(container).run({
    input: { reservations: input },
  })

  logger.info(
    `Created ${input.length} reservation(s) across ${perSeller.size} seller(s).`
  )
}
