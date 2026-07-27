import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules, ProductStatus, SellerStatus } from "@mercurjs/types"

import type SearchModuleService from "../../modules/search/service"
import { SearchProductInput } from "../../modules/search/types"

const PRODUCT_FIELDS = [
  "id",
  "status",
  "title",
  "handle",
  "description",
  "thumbnail",
  "collection.id",
  "type.id",
  "categories.id",
  "tags.id",
  "product_attribute_values.id",
  "product_attribute_values.attribute.id",
  "product_attribute_values.attribute.is_filterable",
]

const OFFER_FIELDS = [
  "id",
  "product_id",
  "seller_id",
  "sku",
  "seller.status",
  "product_variant.price_set.id",
]

type GraphProduct = {
  id: string
  status: string
  title: string
  handle: string
  description: string | null
  thumbnail: string | null
  collection?: { id: string } | null
  type?: { id: string } | null
  categories?: { id: string }[]
  tags?: { id: string }[]
  product_attribute_values?: {
    id: string
    attribute?: { id: string; is_filterable: boolean } | null
  }[]
}

type GraphOffer = {
  id: string
  product_id: string
  seller_id: string
  sku: string | null
  seller?: { status: string } | null
  product_variant?: { price_set?: { id: string } | null } | null
}

type GraphRegion = { id: string; currency_code: string }

type CalculatedPrice = { id: string; calculated_amount: number | null }

const unique = (values: string[]): string[] => Array.from(new Set(values))

export const syncSearchProducts = async (
  container: MedusaContainer,
  productIds: string[]
): Promise<void> => {
  const ids = unique(productIds).filter(Boolean)
  if (!ids.length) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricing = container.resolve(Modules.PRICING)
  const search = container.resolve<SearchModuleService>(MercurModules.SEARCH)

  const { data: products } = await query.graph({
    entity: "product",
    fields: PRODUCT_FIELDS,
    filters: { id: ids },
  })
  const graphProducts = products as GraphProduct[]

  const found = new Set(graphProducts.map((p) => p.id))
  const published = graphProducts.filter(
    (p) => p.status === ProductStatus.PUBLISHED
  )

  const deleteIds = [
    ...ids.filter((id) => !found.has(id)),
    ...graphProducts
      .filter((p) => p.status !== ProductStatus.PUBLISHED)
      .map((p) => p.id),
  ]
  if (deleteIds.length) {
    await search.deleteProducts(deleteIds)
  }
  if (!published.length) {
    return
  }

  const publishedIds = published.map((p) => p.id)
  const { data: offers } = await query.graph({
    entity: "offer",
    fields: OFFER_FIELDS,
    filters: { product_id: publishedIds },
  })
  const offersByProduct = new Map<string, GraphOffer[]>()
  for (const offer of offers as GraphOffer[]) {
    if (
      offer.seller?.status !== SellerStatus.OPEN ||
      !offer.product_variant?.price_set?.id
    ) {
      continue
    }
    const group = offersByProduct.get(offer.product_id)
    if (group) {
      group.push(offer)
    } else {
      offersByProduct.set(offer.product_id, [offer])
    }
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
  })
  const graphRegions = regions as GraphRegion[]

  const inputs: SearchProductInput[] = []

  for (const product of published) {
    const productOffers = offersByProduct.get(product.id) ?? []
    const priceSetIds = productOffers.map(
      (o) => o.product_variant!.price_set!.id
    )
    const offerIds = productOffers.map((o) => o.id)

    const prices: SearchProductInput["prices"] = []
    if (priceSetIds.length) {
      for (const region of graphRegions) {
        const context: Record<string, unknown> = {
          region_id: region.id,
          currency_code: region.currency_code,
          offer_id: offerIds,
        }
        const calculated = (await pricing.calculatePrices(
          { id: priceSetIds },
          { context: context as Record<string, string | number> }
        )) as unknown as CalculatedPrice[]

        const amounts = calculated
          .map((c) => c.calculated_amount)
          .filter((amount): amount is number => amount != null)
        if (amounts.length) {
          prices.push({
            region_id: region.id,
            currency_code: region.currency_code,
            min_amount: Math.min(...amounts),
            max_amount: Math.max(...amounts),
          })
        }
      }
    }

    const attributes: Record<string, string[]> = {}
    for (const value of product.product_attribute_values ?? []) {
      if (value.attribute?.is_filterable && value.attribute.id) {
        ;(attributes[value.attribute.id] ??= []).push(value.id)
      }
    }

    inputs.push({
      product_id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description,
      thumbnail: product.thumbnail,
      status: ProductStatus.PUBLISHED,
      collection_id: product.collection?.id ?? null,
      type_id: product.type?.id ?? null,
      category_ids: (product.categories ?? []).map((c) => c.id),
      tag_ids: (product.tags ?? []).map((t) => t.id),
      seller_ids: unique(productOffers.map((o) => o.seller_id)),
      variant_skus: productOffers
        .map((o) => o.sku)
        .filter((sku): sku is string => Boolean(sku)),
      attributes,
      prices,
    })
  }

  if (inputs.length) {
    await search.upsertProducts(inputs)
  }
}

type EventData = { id?: string; product_id?: string }

const toEventItems = (data: unknown): EventData[] =>
  (Array.isArray(data) ? data : [data]) as EventData[]

export const resolveProductIds = async (
  container: MedusaContainer,
  eventName: string,
  data: unknown
): Promise<string[]> => {
  const items = toEventItems(data)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  if (eventName.startsWith("offer.")) {
    return items.map((i) => i.product_id).filter((id): id is string => !!id)
  }

  if (eventName.startsWith("seller.")) {
    const sellerIds = items.map((i) => i.id).filter((id): id is string => !!id)
    if (!sellerIds.length) {
      return []
    }
    const { data: sellerOffers } = await query.graph({
      entity: "offer",
      fields: ["product_id"],
      filters: { seller_id: sellerIds },
    })
    return (sellerOffers as { product_id: string }[]).map((o) => o.product_id)
  }

  // product.* events
  return items.map((i) => i.id).filter((id): id is string => !!id)
}
