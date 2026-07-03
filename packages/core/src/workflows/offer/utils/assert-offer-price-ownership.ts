import { MedusaError } from "@medusajs/framework/utils"

export type AssertOfferPriceOwnershipInput = {
  offer_id: string
  price_ids: string[]
  owned_price_ids: Iterable<string>
}

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
