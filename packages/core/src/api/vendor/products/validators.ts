import { ProductStatus } from "@medusajs/framework/utils"
import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import { AdditionalData } from "@medusajs/framework/types"

const statusEnum = z.nativeEnum(ProductStatus)

export type VendorGetProductParamsType = z.infer<typeof VendorGetProductParams>
export const VendorGetProductParams = createSelectParams()

export type VendorGetProductVariantParamsType = z.infer<
  typeof VendorGetProductVariantParams
>
export const VendorGetProductVariantParams = createSelectParams()

export type VendorGetProductOptionParamsType = z.infer<
  typeof VendorGetProductOptionParams
>
export const VendorGetProductOptionParams = createSelectParams()

export type VendorGetProductsParamsType = z.infer<typeof VendorGetProductsParams>
export const VendorGetProductsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    title: z.string().optional(),
    handle: z.string().optional(),
    status: statusEnum.array().optional(),
    collection_id: z.union([z.string(), z.array(z.string())]).optional(),
    type_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type VendorGetProductVariantsParamsType = z.infer<
  typeof VendorGetProductVariantsParams
>
export const VendorGetProductVariantsParams = createFindParams({
  offset: 0,
  limit: 50,
})

export type VendorGetProductOptionsParamsType = z.infer<
  typeof VendorGetProductOptionsParams
>
export const VendorGetProductOptionsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    title: z.string().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type VendorCreateVariantPriceType = z.infer<
  typeof VendorCreateVariantPrice
>
export const VendorCreateVariantPrice = z.object({
  currency_code: z.string(),
  amount: z.number(),
  min_quantity: z.number().nullish(),
  max_quantity: z.number().nullish(),
  rules: z.record(z.string(), z.string()).optional(),
})

export type VendorCreateProductOptionType = z.infer<typeof CreateProductOption> & AdditionalData
export const CreateProductOption = z.object({
  title: z.string(),
  values: z.array(z.string()),
})
export const VendorCreateProductOption = WithAdditionalData(CreateProductOption)

export type VendorUpdateProductOptionType = z.infer<typeof UpdateProductOption> & AdditionalData
export const UpdateProductOption = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  values: z.array(z.string()).optional(),
})
export const VendorUpdateProductOption = WithAdditionalData(UpdateProductOption)

export type VendorCreateProductVariantType = z.infer<typeof CreateProductVariant> & AdditionalData
export const CreateProductVariant = z
  .object({
    title: z.string(),
    sku: z.string().optional(),
    ean: z.string().optional(),
    upc: z.string().optional(),
    barcode: z.string().optional(),
    hs_code: z.string().optional(),
    mid_code: z.string().optional(),
    allow_backorder: z.boolean().optional().default(false),
    manage_inventory: z.boolean().optional().default(true),
    variant_rank: z.number().optional(),
    weight: z.number().optional(),
    length: z.number().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    origin_country: z.string().optional(),
    material: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    prices: z.array(VendorCreateVariantPrice),
    options: z.record(z.string()).optional(),
    inventory_items: z
      .array(
        z.object({
          inventory_item_id: z.string(),
          required_quantity: z.number(),
        })
      )
      .optional(),
  })
  .strict()
export const VendorCreateProductVariant = WithAdditionalData(CreateProductVariant)

export type VendorUpdateProductVariantType = z.infer<typeof UpdateProductVariant> & AdditionalData
export const UpdateProductVariant = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    prices: z.array(VendorCreateVariantPrice).optional(),
    sku: z.string().nullish(),
    ean: z.string().nullish(),
    upc: z.string().nullish(),
    barcode: z.string().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
    thumbnail: z.string().nullish(),
    allow_backorder: z.boolean().optional(),
    manage_inventory: z.boolean().optional(),
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
export const VendorUpdateProductVariant = WithAdditionalData(UpdateProductVariant)

const IdAssociation = z.object({
  id: z.string(),
})

export type VendorCreateProductType = z.infer<typeof CreateProduct> & AdditionalData
export const CreateProduct = z
  .object({
    title: z.string(),
    subtitle: z.string().nullish(),
    description: z.string().nullish(),
    is_giftcard: z.boolean().optional().default(false),
    discountable: z.boolean().optional().default(true),
    images: z.array(z.object({ url: z.string() })).optional(),
    thumbnail: z.string().nullish(),
    handle: z.string().optional(),
    status: statusEnum.nullish().default(ProductStatus.DRAFT),
    external_id: z.string().nullish(),
    type_id: z.string().nullish(),
    collection_id: z.string().nullish(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    options: z.array(CreateProductOption).optional(),
    variants: z.array(CreateProductVariant).optional(),
    sales_channels: z.array(z.object({ id: z.string() })).optional(),
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
export const VendorCreateProduct = WithAdditionalData(CreateProduct)

export type VendorUpdateProductType = z.infer<typeof UpdateProduct> & AdditionalData
export const UpdateProduct = z
  .object({
    title: z.string().optional(),
    discountable: z.boolean().optional(),
    is_giftcard: z.boolean().optional(),
    options: z.array(UpdateProductOption).optional(),
    variants: z.array(UpdateProductVariant).optional(),
    status: statusEnum.optional(),
    subtitle: z.string().nullish(),
    description: z.string().nullish(),
    images: z
      .array(z.object({ id: z.string().optional(), url: z.string() }))
      .optional(),
    thumbnail: z.string().nullish(),
    handle: z.string().optional(),
    type_id: z.string().nullish(),
    external_id: z.string().nullish(),
    collection_id: z.string().nullish(),
    categories: z.array(IdAssociation).optional(),
    tags: z.array(IdAssociation).optional(),
    sales_channels: z.array(z.object({ id: z.string() })).optional(),
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
