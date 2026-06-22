import { MedusaError } from "@medusajs/framework/utils"

export type AssertOfferPriceOwnershipInput = {
  offer_id: string
  price_ids: string[]
  owned_price_ids: Iterable<string>
}

/**
 * Write-isolation guard for the shared-PriceSet model. Throws
 * `MedusaError.Types.NOT_ALLOWED` if any caller-supplied `price.id` does
 * not belong to the offer named by `offer_id` (per the `offer ↔ price`
 * list-link pivot). Returns void on success.
 *
 * The shared `PriceSet` keeps every vendor's offer prices on the same
 * row table, so application-level guards are the access boundary — there
 * is no FK that would refuse a foreign id. Every pricing write workflow
 * MUST call this before dispatching to the pricing module.
 */
export const assertOfferPriceOwnership = ({
  offer_id,
  price_ids,
  owned_price_ids,
}: AssertOfferPriceOwnershipInput): void => {
  if (!price_ids.length) {
    return
  }

  const owned = new Set(owned_price_ids)
  const foreign = price_ids.find((id) => !owned.has(id))

  if (foreign) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Price ${foreign} does not belong to offer ${offer_id}`,
    )
  }
}
