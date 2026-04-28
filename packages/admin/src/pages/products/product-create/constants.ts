import { z } from "zod"
import { i18n } from "../../../components/utilities/i18n/i18n"
import { optionalFloat, optionalInt } from "../../../lib/validation"
import { decorateVariantsWithDefaultValues } from "./utils"

export const MediaSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  isThumbnail: z.boolean(),
  file: z.any().nullable(), // File
})

const ProductCreateVariantSchema = z.object({
  should_create: z.boolean(),
  is_default: z.boolean().optional(),
  title: z.string(),
  upc: z.string().optional(),
  ean: z.string().optional(),
  barcode: z.string().optional(),
  mid_code: z.string().optional(),
  hs_code: z.string().optional(),
  width: optionalInt,
  height: optionalInt,
  length: optionalInt,
  weight: optionalInt,
  material: z.string().optional(),
  origin_country: z.string().optional(),
  sku: z.string().optional(),
  manage_inventory: z.boolean().optional(),
  allow_backorder: z.boolean().optional(),
  inventory_kit: z.boolean().optional(),
  attribute_values: z.record(z.string(), z.string()).optional(),
  variant_rank: z.number(),
  prices: z.record(z.string(), optionalFloat).optional(),
  inventory: z
    .array(
      z.object({
        inventory_item_id: z.string(),
        required_quantity: optionalInt,
      })
    )
    .optional(),
})

export type ProductCreateVariantSchema = z.infer<
  typeof ProductCreateVariantSchema
>

export const ProductCreateSchema = z
  .object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    handle: z.string().optional(),
    description: z.string().optional(),
    discountable: z.boolean(),
    type_id: z.string().optional(),
    collection_id: z.string().optional(),
    category_id: z.string().min(1),
    seller_id: z.string().optional(),
    tags: z.array(z.string()).optional(),
    origin_country: z.string().optional(),
    material: z.string().optional(),
    width: z.string().optional(),
    length: z.string().optional(),
    height: z.string().optional(),
    weight: z.string().optional(),
    mid_code: z.string().optional(),
    hs_code: z.string().optional(),
    attributes: z.array(z.object({
      attribute_id: z.string().optional(),
      title: z.string().min(1),
      values: z.union([z.string(), z.array(z.string())]).optional(),
      is_custom: z.boolean(),
      is_required: z.boolean().optional(),
      use_for_variants: z.boolean(),
      type: z.string().optional(),
      available_values: z.array(z.object({
        id: z.string(),
        name: z.string(),
      })).optional(),
    })).optional(),
    variants: z.array(ProductCreateVariantSchema).min(1),
    media: z.array(MediaSchema).optional(),
  })
  .superRefine((data, ctx) => {
    // Validate required attributes have values
    data.attributes?.forEach((attr, index) => {
      if (!attr.is_required) return

      const isEmpty = attr.values === undefined ||
        attr.values === "" ||
        (Array.isArray(attr.values) && attr.values.length === 0)

      if (isEmpty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`attributes.${index}.values`],
          message: i18n.t("products.create.errors.requiredAttribute"),
        })
      }
    })

    if (data.variants.every((v) => !v.should_create)) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variants"],
        message: "invalid_length",
      })
    }

    const skus = new Set<string>()

    data.variants.forEach((v, index) => {
      if (v.sku) {
        if (skus.has(v.sku)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [`variants.${index}.sku`],
            message: i18n.t("products.create.errors.uniqueSku"),
          })
        }

        skus.add(v.sku)
      }
    })
  })

export const EditProductMediaSchema = z.object({
  media: z.array(MediaSchema),
})

export const PRODUCT_CREATE_FORM_DEFAULTS: Partial<
  z.infer<typeof ProductCreateSchema>
> = {
  discountable: true,
  seller_id: "",
  tags: [],
  variants: decorateVariantsWithDefaultValues([
    {
      title: "Default variant",
      should_create: true,
      variant_rank: 0,
      attribute_values: {},
      inventory: [{ inventory_item_id: "", required_quantity: "" }],
      is_default: true,
    },
  ]),
  attributes: [],
  media: [],
  category_id: "",
  collection_id: "",
  description: "",
  handle: "",
  height: "",
  hs_code: "",
  length: "",
  material: "",
  mid_code: "",
  origin_country: "",
  subtitle: "",
  title: "",
  type_id: "",
  weight: "",
  width: "",
}
