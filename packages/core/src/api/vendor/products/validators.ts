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

const VendorGetProductsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.string().optional(),
  handle: z.string().optional(),
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
    allow_backorder: booleanString().optional().default(false),
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
    allow_backorder: booleanString().optional(),
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

// --- Product create / update ---

export type VendorCreateProductType = z.infer<typeof CreateProduct> &
  AdditionalData
const CreateProduct = z
  .object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
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
    variant_attributes: z
      .array(z.union([z.string(), z.record(z.unknown())]))
      .optional(),
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
export const VendorCreateProduct = WithAdditionalData(CreateProduct)

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
export const VendorUpdateProduct = WithAdditionalData(UpdateProduct)
