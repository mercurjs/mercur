import { z } from "zod"

export const CreateProductVariantSchema = z.object({
  title: z.string().min(1),
  sku: z.string().optional(),
  options: z.record(z.string()).optional(),
})

export const CreateVariantDetailsSchema = CreateProductVariantSchema.pick({
  title: true,
  sku: true,
  options: true,
})

export const CreateVariantDetailsFields = Object.keys(
  CreateVariantDetailsSchema.shape
) as (keyof typeof CreateVariantDetailsSchema.shape)[]
