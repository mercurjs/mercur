import { z } from 'zod'

export enum IndexType {
  PRODUCT = 'products'
}

export enum AlgoliaEvents {
  PRODUCTS_CHANGED = 'algolia.products.changed',
  PRODUCTS_DELETED = 'algolia.products.deleted'
}

export enum IntermediateEvents {
  FULFILLMENT_SET_CHANGED = 'algolia.intermediate.fulfillment_set.changed',
  SERVICE_ZONE_CHANGED = 'algolia.intermediate.service_zone.changed',
  SHIPPING_OPTION_CHANGED = 'algolia.intermediate.shipping_option.changed',
  STOCK_LOCATION_CHANGED = 'algolia.intermediate.stock_location.changed',
  INVENTORY_ITEM_CHANGED = 'algolia.intermediate.inventory_item.changed'
}

export const AlgoliaVariantValidator = z.object({
  id: z.string(),
  title: z.string().nullish(),
  sku: z.string().nullish(),
  barcode: z.string().nullish(),
  ean: z.string().nullish(),
  ups: z.string().nullish(),
  allow_backorder: z.boolean(),
  manage_inventory: z.boolean(),
  hs_code: z.string().nullish(),
  origin_country: z.string().nullish(),
  mid_code: z.string().nullish(),
  material: z.string().nullish(),
  weight: z.number().nullish(),
  length: z.number().nullish(),
  height: z.number().nullish(),
  width: z.number().nullish(),
  variant_rank: z.number().nullish(),
  options: z.array(
    z.object({
      id: z.string(),
      value: z.string(),
      option: z.object({
        id: z.string(),
        title: z.string(),
      }),
    })
  ),
  prices: z.array(
    z.object({
      id: z.string(),
      title: z.string().nullish(),
      currency_code: z.string(),
      min_quantity: z.number().nullish(),
      max_quantity: z.number().nullish(),
      rules_count: z.number(),
      amount: z.number(),
    })
  ),
})

export type AlgoliaProduct = z.infer<typeof AlgoliaProductValidator>
export const AlgoliaProductValidator = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  average_rating: z.coerce.number().nullable().default(null),
  supported_countries: z.array(z.string()).nullable().default([]),
  options: z.array(z.record(z.string())).nullable().default(null),
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        rank: z.number(),
      })
    )
    .nullable()
    .optional(),
  collection: z
    .object({
      title: z.string(),
    })
    .nullable()
    .optional(),
  type: z
    .object({
      value: z.string(),
    })
    .nullable()
    .optional(),
  tags: z
    .array(
      z.object({
        value: z.string(),
      })
    )
    .optional(),
  categories: z
    .array(
      z.object({
        name: z.string(),
        id: z.string(),
      })
    )
    .optional(),
  variants: z.any().nullable().default(null),
  attribute_values: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        is_filterable: z.boolean(),
        ui_component: z.string(),
      })
    )
    .optional(),
  sku: z.string().nullable().optional(),
  ean: z.string().nullable().optional(),
  upc: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  hs_code: z.string().nullable().optional(),
  mid_code: z.string().nullable().optional(),
  weight: z.coerce.number().nullable().optional(),
  length: z.coerce.number().nullable().optional(),
  height: z.coerce.number().nullable().optional(),
  width: z.coerce.number().nullable().optional(),
  origin_country: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  seller: z
    .object({
      id: z.string(),
      handle: z.string().nullish(),
      status: z.string().nullish(),
    })
    .nullable(),
})

export type AlgoliaEntity = AlgoliaProduct

export type AlgoliaSearchResult<T> = {
  hits: T[]
  nbHits: number
  page: number
  nbPages: number
  hitsPerPage: number
  facets?: Record<string, Record<string, number>>
  facets_stats?: Record<
    string,
    { min: number; max: number; avg: number; sum: number }
  >
  processingTimeMS: number
  query: string
}

export interface IAlgoliaModuleService {
  search<T = Record<string, unknown>>(
    indexName: IndexType,
    params: Record<string, unknown>
  ): Promise<AlgoliaSearchResult<T>>
}
