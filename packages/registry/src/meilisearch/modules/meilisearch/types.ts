import { z } from 'zod'

export enum IndexType {
  PRODUCT = 'products',
}

export enum MeilisearchEvents {
  PRODUCTS_CHANGED = 'meilisearch.products.changed',
  PRODUCTS_DELETED = 'meilisearch.products.deleted',
}

export const MeilisearchVariantValidator = z.object({
  id: z.string(),
  title: z.string().nullish(),
  sku: z.string().nullish(),
  barcode: z.string().nullish(),
  ean: z.string().nullish(),
  allow_backorder: z.boolean(),
  manage_inventory: z.boolean(),
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
      currency_code: z.string(),
      amount: z.number(),
      min_quantity: z.number().nullish(),
      max_quantity: z.number().nullish(),
      rules_count: z.number(),
    })
  ),
}).passthrough() // allows dynamically injected option keys (e.g. { size: "S" })

export const MeilisearchProductValidator = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  status: z.string(),
  categories: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .optional(),
  tags: z.array(z.object({ value: z.string() })).optional(),
  collection: z.object({ title: z.string() }).nullable().optional(),
  type: z.object({ value: z.string() }).nullable().optional(),
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        rank: z.number(),
      })
    )
    .optional(),
  options: z.array(z.record(z.string())).nullable().default(null),
  variants: z.array(MeilisearchVariantValidator).nullable().default(null),
  seller: z
    .object({
      id: z.string(),
      handle: z.string().nullish(),
      name: z.string().nullish(),
      status: z.string().nullish(),
    })
    .nullable(),
})

export type MeilisearchProduct = z.infer<typeof MeilisearchProductValidator>
export type MeilisearchEntity = MeilisearchProduct

export type MeilisearchSearchResult = {
  hits: Array<{ id: string }>
  totalHits: number
  page: number
  totalPages: number
  hitsPerPage: number
  processingTimeMs: number
  query: string
  facetDistribution?: Record<string, Record<string, number>>
}

export interface IMeilisearchModuleService {
  search(
    query: string,
    options: Record<string, unknown>
  ): Promise<MeilisearchSearchResult>
}
