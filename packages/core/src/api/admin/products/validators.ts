import { z } from "zod"
import { ProductStatus } from "@mercurjs/types"
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

const statusEnum = z.nativeEnum(ProductStatus)

// --- List / retrieve query params ---

const AdminGetProductsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.string().optional(),
  handle: z.string().optional(),
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  status: statusEnum.array().optional(),
  is_active: booleanString().optional(),
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
  created_by: z.string().optional(),
  created_by_actor: z.string().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export type AdminGetProductsParamsType = z.infer<typeof AdminGetProductsParams>
export const AdminGetProductsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminGetProductsParamsFields)
  .merge(applyAndAndOrOperators(AdminGetProductsParamsFields))

export type AdminGetProductParamsType = z.infer<typeof AdminGetProductParams>
export const AdminGetProductParams = createSelectParams()

// --- Create / update product ---

const IdAssociation = z.object({ id: z.string() })

const CreateProductVariant = z
  .object({
    title: z.string(),
    sku: z.string().nullish(),
    ean: z.string().nullish(),
    upc: z.string().nullish(),
    isbn: z.string().nullish(),
    asin: z.string().nullish(),
    gtin: z.string().nullish(),
    barcode: z.string().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
    allow_backorder: booleanString().optional().default(false),
    manage_inventory: booleanString().optional().default(true),
    variant_rank: z.number().optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
    prices: z
      .array(
        z.object({
          currency_code: z.string(),
          amount: z.number(),
          min_quantity: z.number().nullish(),
          max_quantity: z.number().nullish(),
          rules: z.record(z.string(), z.string()).optional(),
        })
      )
      .optional(),
    // See CreateProductVariantDTO.attribute_values — resolved by the service.
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
    allow_backorder: booleanString().optional(),
    manage_inventory: booleanString().optional(),
    variant_rank: z.number().optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
    prices: z
      .array(
        z.object({
          id: z.string().optional(),
          currency_code: z.string().optional(),
          amount: z.number().optional(),
          min_quantity: z.number().nullish(),
          max_quantity: z.number().nullish(),
          rules: z.record(z.string(), z.string()).optional(),
        })
      )
      .optional(),
    attribute_values: z
      .record(z.union([z.string(), z.array(z.string())]))
      .optional(),
  })
  .strict()

// --- Variant query params ---

export type AdminGetProductVariantParamsType = z.infer<
  typeof AdminGetProductVariantParams
>
export const AdminGetProductVariantParams = createSelectParams()

const AdminGetProductVariantsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  sku: z.string().optional(),
  ean: z.string().optional(),
  upc: z.string().optional(),
  barcode: z.string().optional(),
})

export type AdminGetProductVariantsParamsType = z.infer<
  typeof AdminGetProductVariantsParams
>
export const AdminGetProductVariantsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminGetProductVariantsParamsFields)
  .merge(applyAndAndOrOperators(AdminGetProductVariantsParamsFields))

// --- Variant create / update ---

export type AdminCreateProductVariantType = z.infer<
  typeof CreateProductVariant
> &
  AdditionalData
export const AdminCreateProductVariant =
  WithAdditionalData(CreateProductVariant)

export type AdminUpdateProductVariantType = z.infer<
  typeof UpdateProductVariant
> &
  AdditionalData
export const AdminUpdateProductVariant =
  WithAdditionalData(UpdateProductVariant)

// --- Product create / update ---

export type AdminCreateProductType = z.infer<typeof CreateProduct> &
  AdditionalData
const CreateProduct = z
  .object({
    title: z.string(),
    subtitle: z.string().nullish(),
    description: z.string().nullish(),
    is_giftcard: booleanString().optional().default(false),
    discountable: booleanString().optional().default(true),
    images: z.array(z.object({ url: z.string() })).optional(),
    thumbnail: z.string().nullish(),
    handle: z.string().optional(),
    external_id: z.string().nullish(),
    type_id: z.string().nullish(),
    collection_id: z.string().nullish(),
    brand_id: z.string().nullish(),
    is_restricted: z.boolean().optional(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    variant_attributes: z
      .array(z.union([z.string(), z.record(z.unknown())]))
      .optional(),
    variants: z.array(CreateProductVariant).optional(),
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
export const AdminCreateProduct = WithAdditionalData(CreateProduct)

export type AdminUpdateProductType = z.infer<typeof UpdateProduct> &
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
    is_restricted: z.boolean().optional(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    variant_attributes: z
      .array(z.union([z.string(), z.record(z.unknown())]))
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
export const AdminUpdateProduct = WithAdditionalData(UpdateProduct)

// --- Action endpoints ---

export type AdminRejectProductType = z.infer<typeof AdminRejectProduct>
export const AdminRejectProduct = z.object({
  rejection_reason_ids: z.array(z.string()).min(1),
  message: z.string().optional(),
})

export type AdminRequestProductChangesType = z.infer<
  typeof AdminRequestProductChanges
>
export const AdminRequestProductChanges = z.object({
  rejection_reason_ids: z.array(z.string()).min(1),
  message: z.string().optional(),
})
