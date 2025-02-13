import { z } from 'zod'

export type AlgoliaProduct = z.infer<typeof AlgoliaProductValidator>
export const AlgoliaProductValidator = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  collection: z
    .object({
      title: z.string()
    })
    .nullable(),
  type: z
    .object({
      value: z.string()
    })
    .nullable(),
  tags: z
    .array(
      z.object({
        value: z.string()
      })
    )
    .optional(),
  categories: z
    .array(
      z.object({
        name: z.string()
      })
    )
    .optional(),
  sku: z.string().nullable(),
  ean: z.string().nullable(),
  upc: z.string().nullable(),
  barcode: z.string().nullable(),
  hs_code: z.string().nullable(),
  mid_code: z.string().nullable(),
  weight: z.number().nullable(),
  length: z.number().nullable(),
  height: z.number().nullable(),
  width: z.number().nullable(),
  origin_country: z.string().nullable(),
  material: z.string().nullable()
})
