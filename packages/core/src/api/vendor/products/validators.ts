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
import { AdditionalData } from "@medusajs/framework/types"
import { FeatureFlag } from "@medusajs/framework/utils"

const statusEnum = z.nativeEnum(ProductStatus)

// --- List / retrieve query params ---

const VendorGetProductsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.string().optional(),
  handle: z.string().optional(),
  status: statusEnum.array().optional(),
  is_restricted: booleanString().optional(),
  brand_id: z.union([z.string(), z.array(z.string())]).optional(),
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
})

export type VendorGetProductsParamsType = z.infer<typeof VendorGetProductsParams>
export const VendorGetProductsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(VendorGetProductsParamsFields)
  .merge(applyAndAndOrOperators(VendorGetProductsParamsFields))

export type VendorGetProductParamsType = z.infer<typeof VendorGetProductParams>
export const VendorGetProductParams = createSelectParams()

// --- Create / update product ---

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
    attribute_values: z
      .record(z.union([z.string(), z.array(z.string())]))
      .optional(),
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
    attribute_values: z
      .record(z.union([z.string(), z.array(z.string())]))
      .optional(),
  })
  .strict()

const ProductAttributeInput = z.union([
  z.object({
    attribute_id: z.string(),
    value_ids: z.array(z.string()).optional(),
  }),
  z.object({
    name: z.string(),
    type: z.enum(["single_select", "multi_select", "unit", "toggle", "text"]),
    values: z.array(z.string()).optional(),
    is_variant_axis: z.boolean().optional(),
    is_filterable: z.boolean().optional(),
    is_required: z.boolean().optional(),
    description: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
  }),
])

// --- Product create / update ---

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
    brand_id: z.string().optional(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    variant_attributes: z.array(ProductAttributeInput).optional(),
    attribute_values: z.record(z.union([z.string(), z.array(z.string())])).optional(),
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
  })
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
    brand_id: z.string().nullish(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    variant_attributes: z.array(ProductAttributeInput).optional(),
    attribute_values: z.record(z.union([z.string(), z.array(z.string())])).optional(),
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

// --- Product change request payloads ---
//
// All of the following endpoints route through `product-edit-*` workflows
// rather than mutating the product directly. Each one opens a pending
// `ProductChange` and adds an action to it; the change has to be confirmed
// by the operator before the mutation hits the product.

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
    attribute_values: z
      .union([z.array(z.string()), z.record(z.union([z.string(), z.array(z.string())]))])
      .optional(),
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
    attribute_values: z
      .union([z.array(z.string()), z.record(z.union([z.string(), z.array(z.string())]))])
      .optional(),
  })
  .strict()

export type VendorGetProductAttributesParamsType = z.infer<
  typeof VendorGetProductAttributesParams
>
export const VendorGetProductAttributesParams = createFindParams({
  offset: 0,
  limit: 50,
})

export type VendorGetProductAttributeParamsType = z.infer<
  typeof VendorGetProductAttributeParams
>
export const VendorGetProductAttributeParams = createSelectParams()

export type VendorAddProductAttributeType = z.infer<
  typeof VendorAddProductAttribute
>
export const VendorAddProductAttribute = z
  .object({
    attribute_id: z.string(),
    attribute_value_ids: z.array(z.string()).optional(),
    values: z.array(z.string()).optional(),
  })
  .strict()
