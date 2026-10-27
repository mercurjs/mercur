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
import {
  computeExpectedDelivery,
  ExpectedDelivery,
  getMarketplaceDefaultLeadtime,
  resolveLeadtimeToShip,
  resolveTransitDays,
  ShippingRuleRequirement,
} from "@mercurjs/types"

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
  const { data: channels } = await query.graph(
    {
      entity: "sales_channel",
      fields: ["stock_locations.id"],
      filters: { id: channelToUse },
    },
    { cache: { enable: true } }
  )

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
  const withEffectiveLeadtime = fields.includes(EFFECTIVE_LEADTIME_FIELD)
  const withEstimatedDelivery = fields.includes(ESTIMATED_DELIVERY_FIELD)

  const filteredFields = fields.filter(
    (f) =>
      f !== "calculated_price" &&
      !f.startsWith("calculated_price.") &&
      f !== "inventory_quantity" &&
      f !== "in_stock" &&
      f !== EFFECTIVE_LEADTIME_FIELD &&
      f !== ESTIMATED_DELIVERY_FIELD
  )

  const required = [
    ...(withEffectiveLeadtime || withEstimatedDelivery
      ? ["seller_id", "leadtime_to_ship"]
      : []),
    ...(withEstimatedDelivery ? ["shipping_profile_id"] : []),
  ]
  for (const field of required) {
    if (!filteredFields.includes(field)) {
      filteredFields.push(field)
    }
  }

  return {
    fields: filteredFields,
    withCalculatedPrice,
    withInventoryQuantity: withInventoryQuantity || withInStock,
    withEffectiveLeadtime,
    withEstimatedDelivery,
  }
}

export const EFFECTIVE_LEADTIME_FIELD = "effective_leadtime_to_ship"

type LeadtimeOffer = {
  seller_id?: string | null
  leadtime_to_ship?: number | null
  effective_leadtime_to_ship?: number | null
}

/**
 * Adds `effective_leadtime_to_ship`: the offer's lead time, else its seller's
 * default, else the marketplace default, so storefronts need no fallback logic.
 */
export const wrapOffersWithEffectiveLeadtime = async (
  req: MedusaStoreRequest<unknown>,
  offers: LeadtimeOffer[]
): Promise<void> => {
  if (!offers?.length) {
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerIds = [
    ...new Set(offers.map((o) => o.seller_id).filter((id): id is string => !!id)),
  ]

  const sellerDefaults = new Map<string, number | null>()
  if (sellerIds.length) {
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "default_leadtime_to_ship"],
      filters: { id: sellerIds },
    })
    for (const seller of sellers) {
      sellerDefaults.set(seller.id, seller.default_leadtime_to_ship ?? null)
    }
  }

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "metadata"],
    pagination: { take: 1 },
  })
  const marketplaceDefault = getMarketplaceDefaultLeadtime(stores[0]?.metadata)

  for (const offer of offers) {
    offer.effective_leadtime_to_ship = resolveLeadtimeToShip(
      offer.leadtime_to_ship,
      offer.seller_id ? sellerDefaults.get(offer.seller_id) : null,
      marketplaceDefault
    )
  }
}

export const ESTIMATED_DELIVERY_FIELD = "estimated_delivery"

type DeliveryEstimateOffer = {
  seller_id?: string | null
  shipping_profile_id?: string | null
  leadtime_to_ship?: number | null
  estimated_delivery?: ExpectedDelivery | null
}

type EstimateShippingOption = {
  id: string
  metadata: Record<string, unknown> | null
  shipping_rule?: {
    shipping_profile_id: string
    requirement: string
    transit_min_days: number | null
    transit_max_days: number | null
    shipping_zone?: {
      is_active: boolean
      geo_zones?: { country_code: string }[] | null
    } | null
    shipping_method?: {
      is_active: boolean
      cutoff_time: string | null
    } | null
  } | null
}

type EstimateSeller = {
  id: string
  default_leadtime_to_ship: number | null
  closed_from: string | null
  closed_to: string | null
}

const sooner = (a: ExpectedDelivery, b: ExpectedDelivery) =>
  (b.latest ?? b.earliest ?? b.shipping_deadline) <
  (a.latest ?? a.earliest ?? a.shipping_deadline)

/**
 * Adds `estimated_delivery`: the fastest window among the seller's shipping
 * options enabled from a marketplace rule for the offer's shipping profile,
 * limited to zones reaching the request's country when one is known.
 */
export const wrapOffersWithEstimatedDelivery = async (
  req: MedusaStoreRequest<unknown>,
  offers: DeliveryEstimateOffer[]
): Promise<void> => {
  if (!offers?.length) {
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerIds = [
    ...new Set(offers.map((o) => o.seller_id).filter((id): id is string => !!id)),
  ]
  if (!sellerIds.length) {
    offers.forEach((offer) => (offer.estimated_delivery = null))
    return
  }

  const countryCode = (
    ((req.pricingContext as Record<string, unknown> | undefined)
      ?.country_code as string | undefined) ??
    ((req.validatedQuery as Record<string, unknown> | undefined)
      ?.country_code as string | undefined)
  )?.toLowerCase()

  const [{ data: sellers }, { data: links }, { data: stores }] =
    await promiseAll([
      query.graph({
        entity: "seller",
        fields: ["id", "default_leadtime_to_ship", "closed_from", "closed_to"],
        filters: { id: sellerIds },
      }),
      query.graph({
        entity: "shipping_option_seller",
        fields: ["shipping_option_id", "seller_id"],
        filters: { seller_id: sellerIds },
      }),
      query.graph({
        entity: "store",
        fields: ["id", "metadata"],
        pagination: { take: 1 },
      }),
    ])

  const sellerById = new Map(
    (sellers as unknown as EstimateSeller[]).map((seller) => [seller.id, seller])
  )
  const sellerByOption = new Map(
    (links as { shipping_option_id: string; seller_id: string }[]).map(
      (link) => [link.shipping_option_id, link.seller_id]
    )
  )

  const { data: options } = sellerByOption.size
    ? await query.graph({
        entity: "shipping_option",
        fields: [
          "id",
          "metadata",
          "shipping_rule.shipping_profile_id",
          "shipping_rule.requirement",
          "shipping_rule.transit_min_days",
          "shipping_rule.transit_max_days",
          "shipping_rule.shipping_zone.is_active",
          "shipping_rule.shipping_zone.geo_zones.country_code",
          "shipping_rule.shipping_method.is_active",
          "shipping_rule.shipping_method.cutoff_time",
        ],
        filters: { id: Array.from(sellerByOption.keys()) },
      })
    : { data: [] }

  const optionsBySellerProfile = new Map<string, EstimateShippingOption[]>()
  for (const option of options as unknown as EstimateShippingOption[]) {
    const rule = option.shipping_rule
    const sellerId = sellerByOption.get(option.id)
    if (
      !rule ||
      !sellerId ||
      rule.requirement === ShippingRuleRequirement.NOT_SUPPORTED ||
      rule.shipping_zone?.is_active === false ||
      rule.shipping_method?.is_active === false
    ) {
      continue
    }
    if (
      countryCode &&
      !(rule.shipping_zone?.geo_zones ?? []).some(
        (geo) => geo.country_code.toLowerCase() === countryCode
      )
    ) {
      continue
    }
    const key = `${sellerId}:${rule.shipping_profile_id}`
    const list = optionsBySellerProfile.get(key) ?? []
    list.push(option)
    optionsBySellerProfile.set(key, list)
  }

  const marketplaceDefault = getMarketplaceDefaultLeadtime(stores[0]?.metadata)
  const now = new Date()

  for (const offer of offers) {
    offer.estimated_delivery = null
    if (!offer.seller_id || !offer.shipping_profile_id) {
      continue
    }
    const seller = sellerById.get(offer.seller_id)
    const leadtime = resolveLeadtimeToShip(
      offer.leadtime_to_ship,
      seller?.default_leadtime_to_ship,
      marketplaceDefault
    )
    for (const option of optionsBySellerProfile.get(
      `${offer.seller_id}:${offer.shipping_profile_id}`
    ) ?? []) {
      const transit = resolveTransitDays(option.metadata, option.shipping_rule)
      if (transit.min === null && transit.max === null) {
        continue
      }
      const estimate = computeExpectedDelivery({
        start: now,
        leadtimeDays: leadtime,
        transitMinDays: transit.min,
        transitMaxDays: transit.max,
        closure: seller,
        cutoffTime: option.shipping_rule?.shipping_method?.cutoff_time,
      })
      if (!offer.estimated_delivery || sooner(offer.estimated_delivery, estimate)) {
        offer.estimated_delivery = estimate
      }
    }
  }
}
