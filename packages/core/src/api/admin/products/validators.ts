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
import { AdditionalData, OperatorMap } from "@medusajs/framework/types"
import { isPresent } from "@medusajs/framework/utils"

const statusEnum = z.nativeEnum(ProductStatus)

// --- List / retrieve query params ---

const AdminGetProductsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.string().optional(),
  handle: z.string().optional(),
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
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
    variant_rank: z.number().optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
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

// --- Attribute input validators ---

const ProductAttributeInput = z.union([
  z.object({
    attribute_id: z.string(),
    value_ids: z.array(z.string()).optional(),
    values: z.array(z.string()).optional(),
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
    status: statusEnum.optional(),
    external_id: z.string().nullish(),
    type_id: z.string().nullish(),
    collection_id: z.string().nullish(),
    brand_id: z.string().nullish(),
    is_restricted: z.boolean().optional(),
    seller_ids: z.array(z.string()).optional(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    variant_attributes: z.array(ProductAttributeInput).optional(),
    product_attributes: z.array(ProductAttributeInput).optional(),
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
export const UpdateProduct = z
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
    status: statusEnum.optional(),
    external_id: z.string().nullish(),
    type_id: z.string().nullish(),
    collection_id: z.string().nullish(),
    brand_id: z.string().nullish(),
    is_restricted: z.boolean().optional(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    variant_attributes: z.array(ProductAttributeInput).optional(),
    product_attributes: z.array(ProductAttributeInput).optional(),
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

// --- Batch products ---

const BatchProductsUpdateItem = UpdateProduct.extend({
  id: z.string(),
})

const BatchProducts = z.object({
  update: z.array(BatchProductsUpdateItem).optional(),
  delete: z.array(z.string()).optional(),
})

export type AdminBatchProductsType = z.infer<typeof BatchProducts> &
  AdditionalData
export const AdminBatchProducts = WithAdditionalData(BatchProducts)

// --- Batch product attributes ---

const BatchProductAttributeCreate = z.union([
  // Select types — reference existing value IDs
  z.object({
    attribute_id: z.string(),
    attribute_value_ids: z.array(z.string()).optional(),
  }).strict(),
  // Text/unit/toggle types — provide new value strings
  z.object({
    attribute_id: z.string(),
    values: z.array(z.string()),
  }).strict(),
])

export type AdminBatchProductAttributesType = z.infer<
  typeof AdminBatchProductAttributes
>
export const AdminBatchProductAttributes = z.object({
  create: z.array(BatchProductAttributeCreate).optional(),
  delete: z.array(z.string()).optional(),
})
