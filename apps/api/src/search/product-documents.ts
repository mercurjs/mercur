import type { RemoteQueryFunction } from "@medusajs/framework/types"
import { ProductStatus, SellerStatus } from "@mercurjs/types"

export const PRODUCT_SOURCE_FIELDS = [
  "id",
  "title",
  "description",
  "handle",
  "thumbnail",
  "status",
  "created_at",
  "updated_at",
  "deleted_at",
  "collection_id",
  "type_id",
  "categories.id",
  "product_attribute_values.name",
  "product_attribute_values.attribute.handle",
  "product_attribute_values.attribute.is_filterable",
]

export type ProductSourceRow = {
  id: string
  title: string
  description: string | null
  handle: string
  thumbnail: string | null
  status: string
  created_at: string | Date
  deleted_at?: string | Date | null
  collection_id: string | null
  type_id: string | null
  categories?: { id: string }[] | null
  product_attribute_values?:
    | {
        name: string
        attribute?: { handle: string | null; is_filterable: boolean } | null
      }[]
    | null
}

export type ProductSearchDocument = {
  id: string
  product_id: string
  currency_code: string
  title: string
  description: string
  handle: string
  thumbnail: string | null
  status: string
  created_at: Date
  collection_id: string | null
  type_id: string | null
  category_ids: string[]
  attribute_values: string[]
  seller_handles: string[]
  min_price: number
}

type OfferRow = {
  product_id: string
  seller?: {
    handle: string
    status: string
    closed_from: string | Date | null
    closed_to: string | Date | null
  } | null
  prices?: { amount: number; currency_code: string }[] | null
}

const OFFER_FIELDS = [
  "product_id",
  "seller.handle",
  "seller.status",
  "seller.closed_from",
  "seller.closed_to",
  "prices.amount",
  "prices.currency_code",
]

// Descriptions are rich text; the tags would otherwise match searches.
const toPlainText = (html: string | null) =>
  (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export const attributeValueKey = (handle: string, value: string) =>
  `${handle}:${value}`

export const documentId = (productId: string, currencyCode: string) =>
  `${productId}:${currencyCode}`

// Mirrors the store visibility rule: sellers must be open and outside a
// scheduled closure window to be purchasable.
const isSellerVisible = (
  seller: NonNullable<OfferRow["seller"]>,
  now: number
) => {
  if (seller.status !== SellerStatus.OPEN) {
    return false
  }
  const from = seller.closed_from ? new Date(seller.closed_from).getTime() : null
  const to = seller.closed_to ? new Date(seller.closed_to).getTime() : null
  if (from !== null && from <= now && (to === null || to >= now)) {
    return false
  }
  return true
}

type CurrencyOffers = Map<string, { min: number; sellers: Set<string> }>

const collectOffers = async (
  query: RemoteQueryFunction,
  productIds: string[]
): Promise<Map<string, CurrencyOffers>> => {
  const byProduct = new Map<string, CurrencyOffers>()
  if (!productIds.length) {
    return byProduct
  }

  const { data } = await query.graph({
    entity: "offer",
    fields: OFFER_FIELDS,
    filters: { product_id: productIds },
  })

  const now = Date.now()
  for (const offer of data as OfferRow[]) {
    if (!offer.seller || !isSellerVisible(offer.seller, now)) {
      continue
    }
    let currencies = byProduct.get(offer.product_id)
    if (!currencies) {
      currencies = new Map()
      byProduct.set(offer.product_id, currencies)
    }
    for (const price of offer.prices ?? []) {
      const currency = price.currency_code?.toLowerCase()
      const amount = Number(price.amount)
      if (!currency || !Number.isFinite(amount)) {
        continue
      }
      const entry = currencies.get(currency)
      if (entry) {
        entry.min = Math.min(entry.min, amount)
        entry.sellers.add(offer.seller.handle)
      } else {
        currencies.set(currency, {
          min: amount,
          sellers: new Set([offer.seller.handle]),
        })
      }
    }
  }

  return byProduct
}

/**
 * One document per product and currency: numeric search fields have to be
 * declared up front, so a per-currency price cannot live on a single
 * document without a fixed currency list. Filtering on `currency_code`
 * makes price filters, sorting and stats exact for the shopper's region.
 */
export const buildProductDocuments = async (
  query: RemoteQueryFunction,
  rows: ProductSourceRow[]
): Promise<ProductSearchDocument[]> => {
  const published = rows.filter(
    (row) => row.status === ProductStatus.PUBLISHED && !row.deleted_at
  )
  const offers = await collectOffers(
    query,
    published.map((row) => row.id)
  )

  const documents: ProductSearchDocument[] = []
  for (const row of published) {
    const currencies = offers.get(row.id)
    if (!currencies?.size) {
      continue
    }

    const attributeValues = Array.from(
      new Set(
        (row.product_attribute_values ?? [])
          .filter((value) => value.attribute?.is_filterable && value.attribute.handle)
          .map((value) => attributeValueKey(value.attribute!.handle!, value.name))
      )
    )
    const base = {
      product_id: row.id,
      title: row.title,
      description: toPlainText(row.description),
      handle: row.handle,
      thumbnail: row.thumbnail,
      status: row.status,
      created_at: new Date(row.created_at),
      collection_id: row.collection_id,
      type_id: row.type_id,
      category_ids: (row.categories ?? []).map((category) => category.id),
      attribute_values: attributeValues,
    }

    for (const [currency, entry] of currencies) {
      documents.push({
        id: documentId(row.id, currency),
        currency_code: currency,
        seller_handles: Array.from(entry.sellers),
        min_price: entry.min,
        ...base,
      })
    }
  }

  return documents
}
