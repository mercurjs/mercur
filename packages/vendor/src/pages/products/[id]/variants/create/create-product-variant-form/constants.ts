import { z } from "zod"

export const CreateProductVariantSchema = z.object({
  title: z.string().min(1),
  sku: z.string().optional(),
  attribute_values: z
    .record(z.union([z.string(), z.array(z.string())]))
    .optional(),
})

export const CreateVariantDetailsSchema = CreateProductVariantSchema.pick({
  title: true,
  sku: true,
  attribute_values: true,
})

export const CreateVariantDetailsFields = Object.keys(
  CreateVariantDetailsSchema.shape
) as (keyof typeof CreateVariantDetailsSchema.shape)[]
