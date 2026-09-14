import {
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  ItemTaxLineDTO,
  MedusaPricingContext,
  TaxableItemDTO,
  TaxCalculationContext,
} from "@medusajs/framework/types"
import { calculateAmountsWithTax, promiseAll } from "@medusajs/framework/utils"
import { transformAndValidateSalesChannelIds } from "@medusajs/medusa/api/utils/middlewares/index"

type OfferLocationLevel = {
  location_id: string
  stocked_quantity: number
}

type OfferInventoryLink = {
  required_quantity?: number | null
  inventory_item?: {
    location_levels?: OfferLocationLevel[] | null
  } | null
}

export type EnrichableOffer = {
  id: string
  product_id?: string
  product_variant?: { price_set?: { id?: string } | null } | null
  inventory_item_link?: OfferInventoryLink[] | null
  calculated_price?: Record<string, unknown> | null
  inventory_quantity?: number | null
  in_stock?: boolean
}

type StoreRequestWithContext = MedusaStoreRequest<unknown> & {
  pricingContext?: MedusaPricingContext
  taxContext?: {
    taxLineContext?: TaxCalculationContext
    taxInclusivityContext?: { automaticTaxes: boolean }
  }
}

export const wrapOffersWithCalculatedPrices = async (
  req: StoreRequestWithContext,
  offers: EnrichableOffer[]
): Promise<void> => {
  if (!req.pricingContext || !offers?.length) {
    return
  }

  const pricingModule = req.scope.resolve(Modules.PRICING)
  const baseContext = req.pricingContext as Record<string, unknown>

  const byPriceSet = new Map<string, EnrichableOffer[]>()
  for (const offer of offers) {
    const priceSetId = offer.product_variant?.price_set?.id
    if (!priceSetId) {
      continue
    }
    const group = byPriceSet.get(priceSetId)
    if (group) {
      group.push(offer)
    } else {
      byPriceSet.set(priceSetId, [offer])
    }
  }

  if (!byPriceSet.size) {
    return
  }

  const singletons: { priceSetId: string; offer: EnrichableOffer }[] = []
  const siblings: { priceSetId: string; offer: EnrichableOffer }[] = []
  for (const [priceSetId, group] of byPriceSet) {
    if (group.length === 1) {
      singletons.push({ priceSetId, offer: group[0] })
    } else {
      for (const offer of group) {
        siblings.push({ priceSetId, offer })
      }
    }
  }

  const tasks: Promise<void>[] = []

  if (singletons.length) {
    tasks.push(
      (async () => {
        const context: Record<string, unknown> = {
          ...baseContext,
          offer_id: singletons.map((s) => s.offer.id),
        }
        const calculated = await pricingModule.calculatePrices(
          { id: singletons.map((s) => s.priceSetId) },
          { context: context as Record<string, string | number> }
        )

        const byPriceSetId = new Map(
          calculated.map((c) => [
            c.id,
            c as unknown as Record<string, unknown>,
          ])
        )
        for (const { priceSetId, offer } of singletons) {
          offer.calculated_price = byPriceSetId.get(priceSetId) ?? null
        }
      })()
    )
  }

  for (const { priceSetId, offer } of siblings) {
    tasks.push(
      (async () => {
        const context: Record<string, unknown> = {
          ...baseContext,
          offer_id: offer.id,
        }
        const [calculated] = await pricingModule.calculatePrices(
          { id: [priceSetId] },
          { context: context as Record<string, string | number> }
        )

        offer.calculated_price =
          (calculated as unknown as Record<string, unknown>) ?? null
      })()
    )
  }

  await promiseAll(tasks)
}

export const wrapOffersWithTaxPrices = async (
  req: StoreRequestWithContext,
  offers: EnrichableOffer[]
): Promise<void> => {
  if (
    !req.taxContext?.taxInclusivityContext ||
    !req.taxContext?.taxLineContext ||
    !offers?.length
  ) {
    return
  }

  const items = offers
    .map((offer) => {
      const price = offer.calculated_price as
        | Record<string, unknown>
        | null
        | undefined
      if (!price || !offer.product_id) {
        return undefined
      }
      return {
        id: offer.id,
        product_id: offer.product_id,
        quantity: 1,
        unit_price: price.calculated_amount as number,
        currency_code: price.currency_code as string,
      }
    })
    .filter((item) => !!item) as TaxableItemDTO[]

  if (!items.length) {
    return
  }

  const taxService = req.scope.resolve(Modules.TAX)
  const taxLines = (await taxService.getTaxLines(
    items,
    req.taxContext.taxLineContext
  )) as unknown as ItemTaxLineDTO[]

  const taxRatesMap = new Map<string, ItemTaxLineDTO[]>()
  taxLines.forEach((taxLine) => {
    const existing = taxRatesMap.get(taxLine.line_item_id) ?? []
    existing.push(taxLine)
    taxRatesMap.set(taxLine.line_item_id, existing)
  })

  offers.forEach((offer) => {
    const price = offer.calculated_price as Record<string, unknown> | null
    if (!price) {
      return
    }

    const taxRatesForOffer = taxRatesMap.get(offer.id) || []

    const { priceWithTax, priceWithoutTax } = calculateAmountsWithTax({
      taxLines: taxRatesForOffer,
      amount: price.calculated_amount as number,
      includesTax: price.is_calculated_price_tax_inclusive as boolean,
    })
    price.calculated_amount_with_tax = priceWithTax
    price.calculated_amount_without_tax = priceWithoutTax

    const {
      priceWithTax: originalPriceWithTax,
      priceWithoutTax: originalPriceWithoutTax,
    } = calculateAmountsWithTax({
      taxLines: taxRatesForOffer,
      amount: price.original_amount as number,
      includesTax: price.is_original_price_tax_inclusive as boolean,
    })
    price.original_amount_with_tax = originalPriceWithTax
    price.original_amount_without_tax = originalPriceWithoutTax
  })
}

export const wrapOffersWithInventoryQuantityForSalesChannel = async (
  req: MedusaStoreRequest<unknown>,
  offers: EnrichableOffer[]
): Promise<void> => {
  if (!offers?.length) {
    return
  }

  const salesChannelIds = transformAndValidateSalesChannelIds(req)
  const publishableApiKeySalesChannelIds =
    req.publishable_key_context?.sales_channel_ids ?? []

  let channelToUse: string
  if (publishableApiKeySalesChannelIds.length === 1) {
    channelToUse = publishableApiKeySalesChannelIds[0]
  } else if (salesChannelIds.length === 1) {
    channelToUse = salesChannelIds[0]
  } else {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Inventory availability cannot be calculated in the given context. Either provide a single sales channel id or configure a single sales channel in the publishable key`
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["stock_locations.id"],
    filters: { id: channelToUse },
  })

  const channelLocationIds = new Set<string>(
    (channels[0]?.stock_locations ?? [])
      .map((l: { id?: string }) => l.id)
      .filter((id: string | undefined): id is string => Boolean(id))
  )

  for (const offer of offers) {
    const links = offer.inventory_item_link ?? []
    if (!links.length) {
      offer.inventory_quantity = 0
      offer.in_stock = false
      continue
    }

    let offerAvailability = Number.POSITIVE_INFINITY
    for (const link of links) {
      const requiredQuantity = link.required_quantity ?? 1
      const levels = link.inventory_item?.location_levels ?? []
      const stocked = levels
        .filter((level) => channelLocationIds.has(level.location_id))
        .reduce((sum, level) => sum + (level.stocked_quantity ?? 0), 0)
      const itemAvailability =
        requiredQuantity > 0 ? Math.floor(stocked / requiredQuantity) : 0
      offerAvailability = Math.min(offerAvailability, itemAvailability)
    }

    const quantity = Number.isFinite(offerAvailability) ? offerAvailability : 0
    offer.inventory_quantity = quantity
    offer.in_stock = quantity > 0
  }
}

export const splitComputedOfferFields = (fields: string[]) => {
  const withCalculatedPrice = fields.some(
    (f) => f === "calculated_price" || f.startsWith("calculated_price.")
  )
  const withInventoryQuantity = fields.includes("inventory_quantity")
  const withInStock = fields.includes("in_stock")

  const filteredFields = fields.filter(
    (f) =>
      f !== "calculated_price" &&
      !f.startsWith("calculated_price.") &&
      f !== "inventory_quantity" &&
      f !== "in_stock"
  )

  return {
    fields: filteredFields,
    withCalculatedPrice,
    withInventoryQuantity: withInventoryQuantity || withInStock,
  }
}
