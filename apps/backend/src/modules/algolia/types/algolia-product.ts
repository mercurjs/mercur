import { z } from 'zod'

export type AlgoliaProduct = z.infer<typeof AlgoliaProductValidator>
export const AlgoliaProductValidator = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  average_rating: z.coerce.number().nullable().default(null),
  options: z.array(z.record(z.string())).nullable().default(null),
  collection: z
    .object({
      title: z.string()
    })
    .nullable()
    .optional(),
  type: z
    .object({
      value: z.string()
    })
    .nullable()
    .optional(),
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
        name: z.string(),
        id: z.string()
      })
    )
    .optional(),
  variants: z
    .array(
      z.record(
        z.union([
          z.string(),
          z.array(z.object({ amount: z.number(), currency_code: z.string() }))
        ])
      )
    )
    .nullable()
    .default(null),
  brand: z
    .object({
      name: z.string()
    })
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
  material: z.string().nullable().optional()
})
