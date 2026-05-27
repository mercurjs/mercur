import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

/**
 * SPEC-007 backfill: collapse per-offer `PriceSet`s onto the master
 * variant's shared `PriceSet`, stamping `offer_id` PriceRules on every
 * row + populating the writable `offer ↔ price` list-link pivot.
 *
 * Idempotent: skips offers whose Price rows already carry the
 * `offer_id` rule on the variant's PriceSet (detected by matching the
 * `(amount, currency_code, rules.offer_id)` triple against the
 * variant's PriceSet).
 *
 * Hard-deletes the orphaned per-offer PriceSets once every row has
 * been re-created on the variant's PriceSet.
 *
 * Run via `medusa exec`:
 *   $ npx medusa exec ./src/scripts/migrate-shared-priceset.ts
 */
export default async function migrateSharedPriceset({
  container,
}: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const pricingModule = container.resolve(Modules.PRICING)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // 1. Load every offer + its variant's existing `price_set.id` + the
  //    legacy per-offer `price_set_id` if still present.
  const { data: offerRows } = await query.graph({
    entity: "offer",
    fields: ["id", "variant_id"],
  })

  logger.info(
    `[migrate-shared-priceset] processing ${offerRows.length} offers`,
  )

  // The legacy column may have been dropped already; we need to read
  // it via the raw PG connection if so. Resolve the column via PG.
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const legacyRows: Array<{ id: string; price_set_id: string | null }> =
    await knex
      .raw(
        `SELECT id, price_set_id FROM "offer" WHERE deleted_at IS NULL`,
      )
      .then((r: { rows: typeof legacyRows }) => r.rows)
      .catch(() => [])

  const legacyPriceSetByOffer = new Map(
    legacyRows.map((r) => [r.id, r.price_set_id]),
  )

  // 2. Resolve variant → price_set.id (materialise virgin PriceSets).
  const variantIds = Array.from(
    new Set(offerRows.map((o: { variant_id: string }) => o.variant_id)),
  )
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "price_set.id"],
    filters: { id: variantIds },
  })

  const variantPriceSetMap = new Map<string, string>()
  const missingVariants: string[] = []
  for (const variant of variants as Array<{
    id: string
    price_set?: { id?: string } | null
  }>) {
    if (variant.price_set?.id) {
      variantPriceSetMap.set(variant.id, variant.price_set.id)
    } else {
      missingVariants.push(variant.id)
    }
  }

  if (missingVariants.length) {
    const created = await pricingModule.createPriceSets(
      missingVariants.map(() => ({ prices: [] })),
    )
    await link.create(
      missingVariants.map((variantId, idx) => ({
        [Modules.PRODUCT]: { variant_id: variantId },
        [Modules.PRICING]: { price_set_id: created[idx].id },
      })),
    )
    missingVariants.forEach((variantId, idx) => {
      variantPriceSetMap.set(variantId, created[idx].id)
    })
  }

  // 3. For each offer, copy rows from the legacy PriceSet to the
  //    variant's PriceSet + write the `offer ↔ price` link.
  const legacyPriceSetIdsToDelete = new Set<string>()
  let migrated = 0
  let skipped = 0

  for (const offer of offerRows as Array<{
    id: string
    variant_id: string
  }>) {
    const variantPriceSetId = variantPriceSetMap.get(offer.variant_id)
    if (!variantPriceSetId) {
      logger.warn(
        `[migrate-shared-priceset] no PriceSet for variant ${offer.variant_id}, skipping offer ${offer.id}`,
      )
      continue
    }

    // Check if rows are already on the variant's PriceSet under this offer.
    const existing = await pricingModule.listPrices(
      {
        price_set_id: [variantPriceSetId],
      },
      { relations: ["price_rules"] },
    )
    const alreadyMigrated = (existing as Array<{
      price_rules?: Array<{ attribute: string; value: string }>
    }>).some((p) =>
      (p.price_rules ?? []).some(
        (r) => r.attribute === "offer_id" && r.value === offer.id,
      ),
    )
    if (alreadyMigrated) {
      skipped++
      const legacyId = legacyPriceSetByOffer.get(offer.id)
      if (legacyId) legacyPriceSetIdsToDelete.add(legacyId)
      continue
    }

    const legacyPriceSetId = legacyPriceSetByOffer.get(offer.id)
    if (!legacyPriceSetId) {
      // No legacy PriceSet to migrate from; nothing to do.
      continue
    }

    const legacyPrices = await pricingModule.listPrices(
      { price_set_id: [legacyPriceSetId] },
      { relations: ["price_rules"] },
    )
    if (!legacyPrices.length) {
      legacyPriceSetIdsToDelete.add(legacyPriceSetId)
      continue
    }

    const newPriceInputs = (legacyPrices as Array<{
      amount: number | string
      currency_code: string
      min_quantity?: number | null
      max_quantity?: number | null
      price_rules?: Array<{ attribute: string; value: string }>
    }>).map((p) => {
      const rules: Record<string, string> = { offer_id: offer.id }
      for (const r of p.price_rules ?? []) {
        if (r.attribute !== "offer_id") {
          rules[r.attribute] = r.value
        }
      }
      return {
        amount: Number(p.amount),
        currency_code: p.currency_code,
        ...(p.min_quantity !== null && p.min_quantity !== undefined
          ? { min_quantity: p.min_quantity }
          : {}),
        ...(p.max_quantity !== null && p.max_quantity !== undefined
          ? { max_quantity: p.max_quantity }
          : {}),
        rules,
      }
    })

    const beforeIds = new Set(
      (
        await pricingModule.listPrices(
          { price_set_id: [variantPriceSetId] },
          {},
        )
      ).map((p) => p.id),
    )

    await pricingModule.addPrices({
      priceSetId: variantPriceSetId,
      prices: newPriceInputs,
    })

    const after = await pricingModule.listPrices(
      { price_set_id: [variantPriceSetId] },
      {},
    )
    const newPriceIds = after
      .map((p) => p.id)
      .filter((id) => !beforeIds.has(id))

    if (newPriceIds.length) {
      await link.create(
        newPriceIds.map((priceId) => ({
          [MercurModules.OFFER]: { offer_id: offer.id },
          [Modules.PRICING]: { price_id: priceId },
        })),
      )
    }

    legacyPriceSetIdsToDelete.add(legacyPriceSetId)
    migrated++
  }

  // 4. Hard-delete orphaned legacy PriceSets.
  if (legacyPriceSetIdsToDelete.size) {
    await pricingModule.deletePriceSets(
      Array.from(legacyPriceSetIdsToDelete),
    )
  }

  logger.info(
    `[migrate-shared-priceset] migrated ${migrated}, skipped ${skipped}, deleted ${legacyPriceSetIdsToDelete.size} legacy PriceSets`,
  )
}
