import { z } from "zod"
import { MercurFeatureFlags, ProductStatus } from "@mercurjs/types"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import {
  applyAndAndOrOperators,
  booleanString,
} from "@medusajs/medusa/api/utils/common-validators/common"
import { AdditionalData, OperatorMap } from "@medusajs/framework/types"
import { FeatureFlag, isPresent } from "@medusajs/framework/utils"

const statusEnum = z.nativeEnum(ProductStatus)

const VendorGetProductsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.string().optional(),
  handle: z.string().optional(),
  status: statusEnum.array().optional(),
  collection_id: z.union([z.string(), z.array(z.string())]).optional(),
  type_id: z.union([z.string(), z.array(z.string())]).optional(),
  category_id: z.union([z.string(), z.array(z.string())]).optional(),
  tag_id: z.union([z.string(), z.array(z.string())]).optional(),
  sku: z.string().optional(),
  ean: z.string().optional(),
  upc: z.string().optional(),
  barcode: z.string().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
  has_offer: booleanString().optional(),
})

export type VendorGetProductsParamsType = z.infer<typeof VendorGetProductsParams>
export const VendorGetProductsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(VendorGetProductsParamsFields)
  .merge(applyAndAndOrOperators(VendorGetProductsParamsFields))
  .transform((data) => {
    const res = { ...data } as Record<string, unknown>

    if (isPresent(data.tag_id)) {
      res.tags = { id: data.tag_id as string[] }
      delete res.tag_id
    }

    if (isPresent(data.category_id)) {
      res.categories = { id: data.category_id as OperatorMap<string> }
      delete res.category_id
    }

    return res
  })

export type VendorGetProductParamsType = z.infer<typeof VendorGetProductParams>
export const VendorGetProductParams = createSelectParams()

const IdAssociation = z.object({ id: z.string() })

const CreateProductVariant = z
  .object({
    title: z.string(),
    sku: z.string().optional(),
    ean: z.string().optional(),
    upc: z.string().optional(),
    isbn: z.string().optional(),
    asin: z.string().optional(),
    gtin: z.string().optional(),
    barcode: z.string().optional(),
    hs_code: z.string().optional(),
    mid_code: z.string().optional(),
    variant_rank: z.number().optional(),
    weight: z.number().optional(),
    length: z.number().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    origin_country: z.string().optional(),
    material: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    options: z.record(z.string()).optional(),
  })
  .strict()

const UpdateProductVariant = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    sku: z.string().nullish(),
    ean: z.string().nullish(),
    upc: z.string().nullish(),
    isbn: z.string().nullish(),
    asin: z.string().nullish(),
    gtin: z.string().nullish(),
    barcode: z.string().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
    thumbnail: z.string().nullish(),
    variant_rank: z.number().optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
    options: z.record(z.string()).optional(),
  })
  .strict()

const AttributeTypeEnum = z.enum([
  "single_select",
  "multi_select",
  "text",
  "toggle",
  "unit",
])

const AttributeScalar = z.union([z.string(), z.number(), z.boolean()])
const UnifiedProductAttributeInput = z.union([
  z
    .object({
      id: z.string(),
      value_ids: z.array(z.string()).optional(),
      value: AttributeScalar.optional(),
    })
    .strict(),
  z
    .object({
      title: z.string().min(1),
      type: AttributeTypeEnum.optional(),
      values: z.array(z.string()).optional(),
      value: AttributeScalar.optional(),
      is_variant_axis: z.boolean().optional(),
      is_filterable: z.boolean().optional(),
      is_required: z.boolean().optional(),
      description: z.string().nullish(),
      metadata: z.record(z.unknown()).nullish(),
    })
    .strict(),
])

export type VendorCreateProductType = z.infer<typeof CreateProduct> &
  AdditionalData
const CreateProduct = z
  .object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    status: statusEnum.optional(),
    is_giftcard: booleanString().optional().default(false),
    discountable: booleanString().optional().default(true),
    images: z.array(z.object({ url: z.string() })).optional(),
    thumbnail: z.string().optional(),
    handle: z.string().optional(),
    external_id: z.string().optional(),
    type_id: z.string().optional(),
    collection_id: z.string().optional(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    options: z
      .array(z.object({ title: z.string(), values: z.array(z.string()) }))
      .optional(),
    attributes: z.array(UnifiedProductAttributeInput).optional(),
    variants: z.array(CreateProductVariant).optional(),
    weight: z.number().optional(),
    length: z.number().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    hs_code: z.string().optional(),
    mid_code: z.string().optional(),
    origin_country: z.string().optional(),
    material: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict()
export const VendorCreateProduct = WithAdditionalData(CreateProduct, (schema) =>
  // `WithAdditionalData`'s modifyCallback is typed to return a `ZodObject`
  // (Medusa 2.16 moved its framework zod to v4); `.superRefine` yields a
  // `ZodEffects`. The schema object is still a valid validator at runtime
  // (it exposes `.parse`), so bridge the v3/v4 instance mismatch here.
  schema.superRefine((data, ctx) => {
    if (
      data.status !== undefined &&
      FeatureFlag.isFeatureEnabled(MercurFeatureFlags.PRODUCT_REQUEST) &&
      data.status !== ProductStatus.DRAFT &&
      data.status !== ProductStatus.PROPOSED
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: `When the product request flow is enabled, status must be one of: ${ProductStatus.DRAFT}, ${ProductStatus.PROPOSED}.`,
      })
    }
  }) as unknown as typeof CreateProduct
)

export type VendorUpdateProductType = z.infer<typeof UpdateProduct> &
  AdditionalData
const UpdateProduct = z
  .object({
    title: z.string().optional(),
    subtitle: z.string().nullish(),
    description: z.string().nullish(),
    discountable: booleanString().optional(),
    is_giftcard: booleanString().optional(),
    images: z
      .array(z.object({ id: z.string().optional(), url: z.string() }))
      .optional(),
    thumbnail: z.string().nullish(),
    handle: z.string().nullish(),
    external_id: z.string().nullish(),
    type_id: z.string().nullish(),
    collection_id: z.string().nullish(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    options: z
      .array(z.object({ title: z.string(), values: z.array(z.string()) }))
      .optional(),
    variants: z.array(UpdateProductVariant).optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
  })
  .strict()
export const VendorUpdateProduct = WithAdditionalData(UpdateProduct)

const VendorGetProductVariantsParamsFields = z.object({
  q: z.string().optional(),
  manage_inventory: booleanString().optional(),
  allow_backorder: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type VendorGetProductVariantsParamsType = z.infer<
  typeof VendorGetProductVariantsParams
>
export const VendorGetProductVariantsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(VendorGetProductVariantsParamsFields)
  .merge(applyAndAndOrOperators(VendorGetProductVariantsParamsFields))

export type VendorGetProductVariantParamsType = z.infer<
  typeof VendorGetProductVariantParams
>
export const VendorGetProductVariantParams = createSelectParams()

export type VendorAddProductVariantType = z.infer<typeof VendorAddProductVariant>
export const VendorAddProductVariant = z
  .object({
    title: z.string(),
    sku: z.string().optional(),
    ean: z.string().optional(),
    upc: z.string().optional(),
    isbn: z.string().optional(),
    asin: z.string().optional(),
    gtin: z.string().optional(),
    barcode: z.string().optional(),
    hs_code: z.string().optional(),
    mid_code: z.string().optional(),
    variant_rank: z.number().optional(),
    weight: z.number().optional(),
    length: z.number().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    origin_country: z.string().optional(),
    material: z.string().optional(),
    allow_backorder: z.boolean().optional(),
    manage_inventory: z.boolean().optional(),
    thumbnail: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    options: z.record(z.string()).optional(),
  })
  .strict()

export type VendorUpdateProductVariantType = z.infer<
  typeof VendorUpdateProductVariant
>
export const VendorUpdateProductVariant = z
  .object({
    title: z.string().optional(),
    sku: z.string().nullish(),
    ean: z.string().nullish(),
    upc: z.string().nullish(),
    isbn: z.string().nullish(),
    asin: z.string().nullish(),
    gtin: z.string().nullish(),
    barcode: z.string().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
    thumbnail: z.string().nullish(),
    variant_rank: z.number().optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    allow_backorder: z.boolean().optional(),
    manage_inventory: z.boolean().optional(),
    metadata: z.record(z.unknown()).nullish(),
    options: z.record(z.string()).optional(),
    images: z
      .object({
        add: z.array(z.string()).optional(),
        remove: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .strict()

const CancelProductChange = z
  .object({
    internal_note: z.string().optional(),
  })
  .strict()

export type VendorCancelProductChangeType = z.infer<
  typeof CancelProductChange
> &
  AdditionalData
export const VendorCancelProductChange = WithAdditionalData(CancelProductChange)

const VendorBatchAttributeScalar = z.union([
  z.string(),
  z.number(),
  z.boolean(),
])
const VendorBatchAttributeAdd = z.union([
  z
    .object({
      id: z.string(),
      value_ids: z.array(z.string()).optional(),
      value: VendorBatchAttributeScalar.optional(),
    })
    .strict(),
  z
    .object({
      title: z.string().min(1),
      type: AttributeTypeEnum.optional(),
      values: z.array(z.string()).optional(),
      value: VendorBatchAttributeScalar.optional(),
      is_variant_axis: z.boolean().optional(),
      is_filterable: z.boolean().optional(),
      is_required: z.boolean().optional(),
      description: z.string().nullish(),
      metadata: z.record(z.unknown()).nullish(),
    })
    .strict()
    .refine(
      (v) => !v.is_variant_axis || (v.type ?? "multi_select") === "multi_select",
      {
        message: "is_variant_axis is only allowed on multi_select attributes",
        path: ["is_variant_axis"],
      },
    )
    .refine(
      (v) =>
        v.is_variant_axis ||
        v.type !== undefined ||
        typeof v.value === "boolean",
      {
        message: "inline non-axis attributes require an explicit type",
        path: ["type"],
      },
    ),
])
const VendorBatchAttributeUpdate = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    add: z
      .array(z.union([z.string(), z.object({ value: z.string() }).strict()]))
      .optional(),
    remove: z.array(z.string()).optional(),
    value: VendorBatchAttributeScalar.optional(),
  })
  .strict()

export type VendorBatchProductAttributesType = z.infer<
  typeof VendorBatchProductAttributes
>
export const VendorBatchProductAttributes = z
  .object({
    add: z.array(VendorBatchAttributeAdd).optional(),
    remove: z.array(z.string()).optional(),
    update: z.array(VendorBatchAttributeUpdate).optional(),
  })
  .strict()
