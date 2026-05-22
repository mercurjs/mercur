import { MedusaRequest } from "@medusajs/framework/http"
import {
  CalculatedPriceSet,
  PricingTypes,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import type { OfferDTO } from "@mercurjs/types"

type OfferOnVariant = OfferDTO & {
  calculated_price?: CalculatedPriceSet | null
}

type VariantInput = {
  id: string
  offers?: OfferOnVariant[]
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return Infinity
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : Infinity
}

export const wrapVariantsWithOffersPrices = async (
  req: MedusaRequest,
  variants: VariantInput[],
) => {
  const variantIds = (variants ?? []).map((v) => v.id)
  if (!variantIds.length) {
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: [
      "id",
      "variant_id",
      "seller_id",
      "shipping_profile_id",
      "price_set_id",
      "sku",
      "ean",
      "upc",
      "metadata",
      "deleted_at",
    ],
    filters: { variant_id: variantIds },
  })

  const liveOffers = (offers ?? []).filter(
    (o: { deleted_at: string | null }) => !o.deleted_at,
  ) as OfferOnVariant[]

  const offersByVariant = new Map<string, OfferOnVariant[]>()
  for (const offer of liveOffers) {
    const list = offersByVariant.get(offer.variant_id) ?? []
    list.push(offer)
    offersByVariant.set(offer.variant_id, list)
  }

  const priceSetIds = Array.from(
    new Set(liveOffers.map((o) => o.price_set_id).filter(Boolean)),
  )

  let calculatedByPriceSet = new Map<
    string,
    CalculatedPriceSet
  >()

  if (priceSetIds.length) {
    const pricingModule = req.scope.resolve(Modules.PRICING)
    const context = (req.pricingContext ?? {}) as PricingTypes.PricingContext["context"]

    const calculated = await pricingModule.calculatePrices(
      { id: priceSetIds },
      { context },
    )

    calculatedByPriceSet = new Map(
      calculated.map((row) => [row.id as string, row]),
    )
  }

  for (const variant of variants) {
    const variantOffers = (offersByVariant.get(variant.id) ?? []).map(
      (offer) => ({
        ...offer,
        calculated_price:
          calculatedByPriceSet.get(offer.price_set_id) ?? null,
      }),
    )

    variantOffers.sort((a, b) => {
      const ap = toNumber(a.calculated_price?.calculated_amount)
      const bp = toNumber(b.calculated_price?.calculated_amount)
      if (ap !== bp) return ap - bp
      return a.id.localeCompare(b.id)
    })

    variant.offers = variantOffers
  }
}
