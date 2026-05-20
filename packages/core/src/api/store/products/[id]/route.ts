import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MathBN,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

type OfferRow = {
  id: string
  seller_id: string
  variant_id: string
  shipping_profile_id: string
  price_set_id: string
  sku: string
  ean: string | null
  upc: string | null
  created_at: string
  deleted_at: string | null
  seller?: { id: string; name?: string; handle?: string } | null
  inventory_items?: Array<{
    inventory_item_id: string
    required_quantity: number
    inventory?: {
      location_levels?: Array<{
        location_id: string
        stocked_quantity?: number
        reserved_quantity?: number
        raw_stocked_quantity?: number
        raw_reserved_quantity?: number
        stock_locations?: Array<{
          id: string
          sales_channels?: Array<{ id: string }>
        }>
      }>
    }
  }>
}

type StoreOfferQuery = {
  region_id?: string
  customer_group_id?: string
  currency_code?: string
  sales_channel_id?: string
}

const computeEffectiveStock = (
  offer: OfferRow,
  allowedLocationIds: Set<string> | null,
): number => {
  const links = offer.inventory_items ?? []
  if (!links.length) return 0

  let min = Number.POSITIVE_INFINITY
  for (const link of links) {
    let perItemMax = 0
    for (const lvl of link.inventory?.location_levels ?? []) {
      if (allowedLocationIds && !allowedLocationIds.has(lvl.location_id)) {
        continue
      }
      const stocked = Number(
        lvl.raw_stocked_quantity ?? lvl.stocked_quantity ?? 0,
      )
      const reserved = Number(
        lvl.raw_reserved_quantity ?? lvl.reserved_quantity ?? 0,
      )
      const avail = Math.max(0, stocked - reserved)
      const denom = Math.max(1, Number(link.required_quantity ?? 1))
      const possible = Math.floor(avail / denom)
      if (possible > perItemMax) perItemMax = possible
    }
    if (perItemMax < min) min = perItemMax
  }
  return min === Number.POSITIVE_INFINITY ? 0 : min
}

const stockStatusFromQty = (qty: number): "in_stock" | "low_stock" | "out_of_stock" => {
  if (qty <= 0) return "out_of_stock"
  if (qty < 5) return "low_stock"
  return "in_stock"
}

export const GET = async (
  req: MedusaRequest<unknown, StoreOfferQuery>,
  res: MedusaResponse,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, id: req.params.id },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

  const variantIds: string[] = (product.variants ?? [])
    .map((v: { id?: string }) => v.id)
    .filter((id: unknown): id is string => typeof id === "string")

  if (!variantIds.length) {
    res.json({ product })
    return
  }

  const queryParams = (req.validatedQuery ?? {}) as StoreOfferQuery
  const region_id = queryParams.region_id
  const customer_group_id = queryParams.customer_group_id
  const currency_code = queryParams.currency_code
  const sales_channel_id = queryParams.sales_channel_id

  const { data: offers } = (await query.graph({
    entity: "offer",
    fields: [
      "id",
      "seller_id",
      "variant_id",
      "shipping_profile_id",
      "price_set_id",
      "sku",
      "ean",
      "upc",
      "created_at",
      "deleted_at",
      "seller.id",
      "seller.name",
      "seller.handle",
      "inventory_items.inventory_item_id",
      "inventory_items.required_quantity",
      "inventory_items.inventory.location_levels.location_id",
      "inventory_items.inventory.location_levels.stocked_quantity",
      "inventory_items.inventory.location_levels.reserved_quantity",
      "inventory_items.inventory.location_levels.raw_stocked_quantity",
      "inventory_items.inventory.location_levels.raw_reserved_quantity",
      "inventory_items.inventory.location_levels.stock_locations.id",
      "inventory_items.inventory.location_levels.stock_locations.sales_channels.id",
    ],
    filters: { variant_id: variantIds, deleted_at: null },
  })) as { data: OfferRow[] }

  // Resolve allowed location set for the cart's sales channel (if provided)
  let allowedLocationIds: Set<string> | null = null
  if (sales_channel_id) {
    allowedLocationIds = new Set<string>()
    for (const offer of offers) {
      for (const link of offer.inventory_items ?? []) {
        for (const lvl of link.inventory?.location_levels ?? []) {
          for (const sl of lvl.stock_locations ?? []) {
            if (sl.sales_channels?.some((sc) => sc.id === sales_channel_id)) {
              allowedLocationIds.add(sl.id)
            }
          }
        }
      }
    }
  }

  const visibleOffers = offers
    .filter((o) => !o.deleted_at)
    .map((o) => ({
      ...o,
      effective_stock: computeEffectiveStock(o, allowedLocationIds),
    }))
    .filter((o) => o.effective_stock > 0)

  let priceByPriceSet = new Map<
    string,
    { calculated_amount?: number; currency_code?: string }
  >()

  if (visibleOffers.length) {
    const pricingModule = req.scope.resolve(Modules.PRICING)
    const priceSetIds = Array.from(
      new Set(visibleOffers.map((o) => o.price_set_id)),
    )
    const calculated = await pricingModule.calculatePrices(
      { id: priceSetIds },
      {
        context: {
          ...(region_id ? { region_id } : {}),
          ...(currency_code ? { currency_code } : {}),
          ...(customer_group_id ? { customer_group_id } : {}),
          quantity: 1,
        } as never,
      },
    )
    priceByPriceSet = new Map(
      calculated.map((row) => [
        row.id,
        {
          calculated_amount: (row.calculated_amount as number | undefined) ?? undefined,
          currency_code: (row.currency_code as string | undefined) ?? undefined,
        },
      ]),
    )
  }

  const variantOffersMap = new Map<
    string,
    Array<{
      id: string
      seller: { id: string; name?: string; handle?: string } | null
      price: number | null
      currency_code: string | null
      stock_status: "in_stock" | "low_stock" | "out_of_stock"
      shipping_profile_id: string
      sku: string
    }>
  >()

  for (const offer of visibleOffers) {
    const priced = priceByPriceSet.get(offer.price_set_id)
    const list = variantOffersMap.get(offer.variant_id) ?? []
    list.push({
      id: offer.id,
      seller: offer.seller ?? null,
      price: priced?.calculated_amount ?? null,
      currency_code: priced?.currency_code ?? null,
      stock_status: stockStatusFromQty(offer.effective_stock),
      shipping_profile_id: offer.shipping_profile_id,
      sku: offer.sku,
    })
    variantOffersMap.set(offer.variant_id, list)
  }

  // Stable order: price ASC (null last), created_at ASC, id ASC
  for (const [vId, list] of variantOffersMap) {
    list.sort((a, b) => {
      const ap = a.price ?? Number.POSITIVE_INFINITY
      const bp = b.price ?? Number.POSITIVE_INFINITY
      if (!MathBN.eq(ap, bp)) return Number(MathBN.sub(ap, bp))
      if (a.id !== b.id) return a.id < b.id ? -1 : 1
      return 0
    })
    variantOffersMap.set(vId, list)
  }

  const variantsWithOffers = (product.variants ?? []).map(
    (v: { id?: string }) => ({
      ...v,
      offers: variantOffersMap.get(v.id as string) ?? [],
    }),
  )

  res.json({
    product: { ...product, variants: variantsWithOffers },
  })
}
