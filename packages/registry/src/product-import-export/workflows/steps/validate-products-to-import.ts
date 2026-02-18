import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"

const CreateVariantPrice = z.object({
  currency_code: z.string(),
  amount: z.number(),
})

const CreateProductOption = z.object({
  title: z.string(),
  values: z.array(z.string()).optional(),
})

const CreateProductVariant = z.object({
  title: z.string(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  ean: z.string().optional().nullable(),
  upc: z.string().optional().nullable(),
  hs_code: z.string().optional().nullable(),
  mid_code: z.string().optional().nullable(),
  manage_inventory: z.boolean().optional(),
  allow_backorder: z.boolean().optional(),
  weight: z.number().optional().nullable(),
  length: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  material: z.string().optional().nullable(),
  origin_country: z.string().optional().nullable(),
  options: z.record(z.string()).optional(),
  prices: z.array(CreateVariantPrice).optional(),
  inventory_quantity: z.number().optional(),
})

const CreateProduct = z.object({
  title: z.string(),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  handle: z.string().optional(),
  status: z.enum(["draft", "proposed", "published", "rejected"]).optional(),
  thumbnail: z.string().optional().nullable(),
  weight: z.number().optional().nullable(),
  length: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  hs_code: z.string().optional().nullable(),
  mid_code: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  origin_country: z.string().optional().nullable(),
  collection_id: z.string().optional().nullable(),
  type_id: z.string().optional().nullable(),
  tags: z.array(z.object({ id: z.string() })).optional(),
  categories: z.array(z.object({ id: z.string() })).optional(),
  sales_channels: z.array(z.object({ id: z.string() })).optional(),
  images: z.array(z.object({ url: z.string() })).optional(),
  options: z.array(CreateProductOption).optional(),
  variants: z.array(CreateProductVariant).optional(),
})

type ValidateProductsToImportStepInput = {
  products: Record<string, any>[]
}

export const validateProductsToImportStep = createStep(
  "validate-products-to-import",
  async (input: ValidateProductsToImportStepInput) => {
    const errors: string[] = []

    for (let i = 0; i < input.products.length; i++) {
      const result = CreateProduct.safeParse(input.products[i])
      if (!result.success) {
        const issues = result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")
        errors.push(`Product ${i + 1}: ${issues}`)
      }
    }

    if (errors.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Validation failed for ${errors.length} product(s):\n${errors.join("\n")}`
      )
    }

    return new StepResponse(input.products)
  }
)
