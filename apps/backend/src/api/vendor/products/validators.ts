import { z } from 'zod'

import { AdditionalData } from '@medusajs/framework/types'
import {
  WithAdditionalData,
} from '@medusajs/medusa/api/utils/validators'

import { IdAssociation } from '../../../shared/infra/http/utils'
import { AdminGetProductsParams } from '@medusajs/medusa/api/admin/products/validators'

export type VendorGetProductParamsType = z.infer<typeof VendorGetProductParams>
export const VendorGetProductParams = AdminGetProductsParams

/* Options */

/**
 * @schema CreateProductOption
 * type: object
 * required:
 *   - title
 *   - values
 * properties:
 *   title:
 *     type: string
 *     description: The title of the product option (e.g. "Size", "Color").
 *   values:
 *     type: array
 *     description: The values that the product option can take (e.g. ["Small", "Medium", "Large"]).
 *     items:
 *       type: string
 */
export type CreateProductOptionType = z.infer<typeof CreateProductOption>
export const CreateProductOption = z.object({
  title: z.string(),
  values: z.array(z.string())
})

/**
 * @schema VendorAssignBrandName
 * type: object
 * required:
 *   - brand_name
 * properties:
 *   brand_name:
 *     type: string
 *     description: The name of the brand.
 */
export type VendorAssignBrandNameType = z.infer<typeof VendorAssignBrandName>
export const VendorAssignBrandName = z.object({
  brand_name: z.string()
})

/**
 * @schema UpdateProductOption
 * type: object
 * properties:
 *   id:
 *     type: string
 *     description: The ID of the option to update.
 *   title:
 *     type: string
 *     description: The title of the product option (e.g. "Size", "Color").
 *   values:
 *     type: array
 *     description: The values that the product option can take (e.g. ["Small", "Medium", "Large"]).
 *     items:
 *       type: string
 */
export type UpdateProductOptionType = z.infer<typeof UpdateProductOption>
export const UpdateProductOption = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  values: z.array(z.string()).optional()
})

/* Variant Prices */

/**
 * @schema CreateVariantPrice
 * type: object
 * required:
 *   - currency_code
 *   - amount
 * properties:
 *   currency_code:
 *     type: string
 *     description: The currency code of the price.
 *   amount:
 *     type: number
 *     description: The amount of the price.
 *   min_quantity:
 *     type: number
 *     nullable: true
 *     description: The minimum quantity required to get this price.
 *   max_quantity:
 *     type: number
 *     nullable: true
 *     description: The maximum quantity allowed to get this price.
 *   rules:
 *     type: object
 *     description: Additional rules that apply to the price.
 *     additionalProperties:
 *       type: string
 */
const CreateVariantPrice = z.object({
  currency_code: z.string(),
  amount: z.number(),
  min_quantity: z.number().nullish(),
  max_quantity: z.number().nullish(),
  rules: z.record(z.string(), z.string()).optional()
})

/**
 * @schema UpdateVariantPrice
 * type: object
 * properties:
 *   id:
 *     type: string
 *     description: The ID of the price to update.
 *   currency_code:
 *     type: string
 *     description: The currency code of the price.
 *   amount:
 *     type: number
 *     description: The amount of the price.
 *   min_quantity:
 *     type: number
 *     nullable: true
 *     description: The minimum quantity required to get this price.
 *   max_quantity:
 *     type: number
 *     nullable: true
 *     description: The maximum quantity allowed to get this price.
 *   rules:
 *     type: object
 *     description: Additional rules that apply to the price.
 *     additionalProperties:
 *       type: string
 */
const UpdateVariantPrice = z.object({
  id: z.string().optional(),
  currency_code: z.string().optional(),
  amount: z.number().optional(),
  min_quantity: z.number().nullish(),
  max_quantity: z.number().nullish(),
  rules: z.record(z.string(), z.string()).optional()
})

/* Variants */

/**
 * @schema CreateProductVariant
 * type: object
 * properties:
 *   title:
 *     type: string
 *     description: The title of the variant.
 *   sku:
 *     type: string
 *     description: The unique SKU for the variant.
 *   ean:
 *     type: string
 *     description: The EAN number of the variant.
 *   upc:
 *     type: string
 *     description: The UPC number of the variant.
 *   barcode:
 *     type: string
 *     description: The barcode of the variant.
 *   hs_code:
 *     type: string
 *     description: The HS code of the variant.
 *   mid_code:
 *     type: string
 *     description: The MID code of the variant.
 *   allow_backorder:
 *     type: boolean
 *     description: Whether the variant can be backordered.
 *     default: false
 *   manage_inventory:
 *     type: boolean
 *     description: Whether Medusa should keep track of inventory for this variant.
 *     default: true
 *   variant_rank:
 *     type: number
 *     description: The rank of the variant.
 *   weight:
 *     type: number
 *     description: The weight of the variant.
 *   length:
 *     type: number
 *     description: The length of the variant.
 *   height:
 *     type: number
 *     description: The height of the variant.
 *   width:
 *     type: number
 *     description: The width of the variant.
 *   origin_country:
 *     type: string
 *     description: The country of origin of the variant.
 *   material:
 *     type: string
 *     description: The material composition of the variant.
 *   metadata:
 *     type: object
 *     description: Additional metadata for the variant.
 *   prices:
 *     type: array
 *     description: The prices of the variant.
 *     items:
 *       $ref: "#/components/schemas/CreateVariantPrice"
 *   options:
 *     type: object
 *     description: The options of the variant.
 *   inventory_items:
 *     type: array
 *     description: The inventory items of the variant.
 *     items:
 *       type: object
 *       properties:
 *         inventory_item_id:
 *           type: string
 *         required_quantity:
 *           type: number
 */
export type CreateProductVariantType = z.infer<typeof CreateProductVariant>
export const CreateProductVariant = z
  .object({
    title: z.string(),
    sku: z.string().optional(),
    ean: z.string().optional(),
    upc: z.string().optional(),
    barcode: z.string().optional(),
    hs_code: z.string().optional(),
    mid_code: z.string().optional(),
    allow_backorder: z.literal(false).optional().default(false),
    manage_inventory: z.literal(true).optional().default(true),
    variant_rank: z.number().optional(),
    weight: z.number().optional(),
    length: z.number().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    origin_country: z.string().optional(),
    material: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    prices: z.array(CreateVariantPrice),
    options: z.record(z.string()).optional(),
    inventory_items: z
      .array(
        z.object({
          inventory_item_id: z.string(),
          required_quantity: z.number()
        })
      )
      .optional()
  })
  .strict()

/**
 * @schema UpdateProductVariant
 * type: object
 * properties:
 *   id:
 *     type: string
 *     description: The ID of the variant to update.
 *   title:
 *     type: string
 *     description: The title of the variant.
 *   prices:
 *     type: array
 *     description: The prices of the variant.
 *     items:
 *       $ref: "#/components/schemas/UpdateVariantPrice"
 *   sku:
 *     type: string
 *     nullable: true
 *     description: The unique SKU for the variant.
 *   ean:
 *     type: string
 *     nullable: true
 *     description: The EAN number of the variant.
 *   upc:
 *     type: string
 *     nullable: true
 *     description: The UPC number of the variant.
 *   barcode:
 *     type: string
 *     nullable: true
 *     description: A generic GTIN field for the variant.
 *   hs_code:
 *     type: string
 *     nullable: true
 *     description: The Harmonized System code of the variant.
 *   mid_code:
 *     type: string
 *     nullable: true
 *     description: The Manufacturer Identification code of the variant.
 *   allow_backorder:
 *     type: boolean
 *     description: Whether the variant can be backordered.
 *   manage_inventory:
 *     type: boolean
 *     description: Whether Medusa should keep track of the inventory of this variant.
 *   variant_rank:
 *     type: number
 *     description: The rank of the variant when presented in a list of variants.
 *   weight:
 *     type: number
 *     nullable: true
 *     description: The weight of the variant.
 *   length:
 *     type: number
 *     nullable: true
 *     description: The length of the variant.
 *   height:
 *     type: number
 *     nullable: true
 *     description: The height of the variant.
 *   width:
 *     type: number
 *     nullable: true
 *     description: The width of the variant.
 *   origin_country:
 *     type: string
 *     nullable: true
 *     description: The country of origin of the variant.
 *   material:
 *     type: string
 *     nullable: true
 *     description: The material composition of the variant.
 *   metadata:
 *     type: object
 *     nullable: true
 *     description: An optional set of key-value pairs with additional information.
 *   options:
 *     type: object
 *     description: The options of the variant.
 *     additionalProperties:
 *       type: string
 */
export type UpdateProductVariantType = z.infer<typeof UpdateProductVariant>
export const UpdateProductVariant = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    prices: z.array(UpdateVariantPrice).optional(),
    sku: z.string().nullish(),
    ean: z.string().nullish(),
    upc: z.string().nullish(),
    barcode: z.string().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
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
    options: z.record(z.string()).optional()
  })
  .strict()

/* Products */

/**
 * @schema CreateProduct
 * type: object
 * required:
 *   - title
 * properties:
 *   title:
 *     type: string
 *     description: The title of the product.
 *   subtitle:
 *     type: string
 *     description: The subtitle of the product.
 *   description:
 *     type: string
 *     description: The description of the product.
 *   is_giftcard:
 *     type: boolean
 *     description: Whether the product is a gift card.
 *     default: false
 *   discountable:
 *     type: boolean
 *     description: Whether the product can be discounted.
 *     default: true
 *   images:
 *     type: array
 *     description: Images of the product.
 *     items:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         url:
 *           type: string
 *   thumbnail:
 *     type: string
 *     description: The thumbnail of the product.
 *   handle:
 *     type: string
 *     description: A unique handle to identify the product.
 *   status:
 *     type: string
 *     enum: [draft, proposed]
 *     description: The status of the product.
 *     default: draft
 *   external_id:
 *     type: string
 *     description: The external ID of the product.
 *   type_id:
 *     type: string
 *     description: The ID of the product type.
 *   collection_id:
 *     type: string
 *     description: The ID of the collection the product belongs to.
 *   categories:
 *     type: array
 *     description: Categories the product belongs to.
 *     items:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *   tags:
 *     type: array
 *     description: Tags associated with the product.
 *     items:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *   options:
 *     type: array
 *     description: Product options.
 *     items:
 *       $ref: "#/components/schemas/CreateProductOption"
 *   variants:
 *     type: array
 *     description: Product variants.
 *     items:
 *       $ref: "#/components/schemas/CreateProductVariant"
 *   weight:
 *     type: number
 *     description: The weight of the product.
 *   length:
 *     type: number
 *     description: The length of the product.
 *   height:
 *     type: number
 *     description: The height of the product.
 *   width:
 *     type: number
 *     description: The width of the product.
 *   hs_code:
 *     type: string
 *     description: The HS code of the product.
 *   mid_code:
 *     type: string
 *     description: The MID code of the product.
 *   origin_country:
 *     type: string
 *     description: The country of origin of the product.
 *   material:
 *     type: string
 *     description: The material composition of the product.
 *   metadata:
 *     type: object
 *     description: Additional metadata for the product.
 *   sales_channels:
 *     type: array
 *     description: Sales channels to associate the product with.
 *     items:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 */
export type VendorCreateProductType = z.infer<typeof CreateProduct> &
  AdditionalData
export const CreateProduct = z
  .object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    is_giftcard: z.boolean().optional().default(false),
    discountable: z.boolean().optional().default(true),
    images: z.array(z.object({ url: z.string() })).optional(),
    thumbnail: z.string().optional(),
    handle: z.string().optional(),
    status: z.enum(['draft', 'proposed']).optional().default('draft'),
    external_id: z.string().optional(),
    type_id: z.string().optional(),
    collection_id: z.string().optional(),
    categories: z.array(IdAssociation).max(1).optional(),
    tags: z.array(IdAssociation).optional(),
    options: z.array(CreateProductOption).optional(),
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
    sales_channels: z.array(z.object({ id: z.string() })).optional(),
    brand_name: z.string().optional()
  })
  .strict()
/**
 * @schema VendorCreateProduct
 * type: object
 * allOf:
 *   - $ref: "#/components/schemas/CreateProduct"
 *   - type: object
 *     properties:
 *      additional_data:
 *        type: object
 *        description: Additional data to use in products hooks.
 *        additionalProperties: true
 *
 */
export const VendorCreateProduct = WithAdditionalData(CreateProduct)

/**
 * @schema UpdateProduct
 * type: object
 * properties:
 *   title:
 *     type: string
 *     description: The title of the product.
 *   discountable:
 *     type: boolean
 *     description: Whether the product can be discounted.
 *   is_giftcard:
 *     type: boolean
 *     description: Whether the product is a gift card.
 *   options:
 *     type: array
 *     description: The product options to update.
 *     items:
 *       $ref: "#/components/schemas/UpdateProductOption"
 *   variants:
 *     type: array
 *     description: The product variants to update.
 *     items:
 *       $ref: "#/components/schemas/UpdateProductVariant"
 *   subtitle:
 *     type: string
 *     nullable: true
 *     description: The subtitle of the product.
 *   description:
 *     type: string
 *     nullable: true
 *     description: The description of the product.
 *   images:
 *     type: array
 *     description: Images of the product.
 *     items:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *   thumbnail:
 *     type: string
 *     nullable: true
 *     description: The thumbnail of the product.
 *   handle:
 *     type: string
 *     nullable: true
 *     description: The handle of the product.
 *   type_id:
 *     type: string
 *     nullable: true
 *     description: The ID of the product type.
 *   external_id:
 *     type: string
 *     nullable: true
 *     description: The external ID of the product.
 *   collection_id:
 *     type: string
 *     nullable: true
 *     description: The ID of the collection the product belongs to.
 *   categories:
 *     type: array
 *     description: Product category IDs to associate with the product.
 *     items:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *   tags:
 *     type: array
 *     description: Product tag IDs to associate with the product.
 *     items:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *   weight:
 *     type: number
 *     nullable: true
 *     description: The weight of the product.
 *   length:
 *     type: number
 *     nullable: true
 *     description: The length of the product.
 *   height:
 *     type: number
 *     nullable: true
 *     description: The height of the product.
 *   width:
 *     type: number
 *     nullable: true
 *     description: The width of the product.
 *   hs_code:
 *     type: string
 *     nullable: true
 *     description: The HS code of the product.
 *   mid_code:
 *     type: string
 *     nullable: true
 *     description: The MID code of the product.
 *   origin_country:
 *     type: string
 *     nullable: true
 *     description: The country of origin of the product.
 *   material:
 *     type: string
 *     nullable: true
 *     description: The material composition of the product.
 *   metadata:
 *     type: object
 *     nullable: true
 *     description: Additional metadata for the product.
 *   sales_channels:
 *     type: array
 *     description: Sales channels to associate the product with.
 *     items:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 */
export type VendorUpdateProductType = z.infer<typeof UpdateProduct> &
  AdditionalData
export const UpdateProduct = z
  .object({
    title: z.string().optional(),
    discountable: z.boolean().optional(),
    is_giftcard: z.boolean().optional(),
    options: z.array(UpdateProductOption).optional(),
    variants: z.array(UpdateProductVariant).optional(),
    subtitle: z.string().nullish(),
    description: z.string().nullish(),
    images: z.array(z.object({ url: z.string() })).optional(),
    thumbnail: z.string().nullish(),
    handle: z.string().nullish(),
    type_id: z.string().nullish(),
    external_id: z.string().nullish(),
    collection_id: z.string().nullish(),
    categories: z.array(IdAssociation).max(1).optional(),
    tags: z.array(IdAssociation).optional(),
    weight: z.number().nullish(),
    length: z.number().nullish(),
    height: z.number().nullish(),
    width: z.number().nullish(),
    hs_code: z.string().nullish(),
    mid_code: z.string().nullish(),
    origin_country: z.string().nullish(),
    material: z.string().nullish(),
    metadata: z.record(z.unknown()).nullish(),
    sales_channels: z.array(z.object({ id: z.string() })).optional()
  })
  .strict()

/**
 * @schema VendorUpdateProduct
 * type: object
 * allOf:
 *   - $ref: "#/components/schemas/UpdateProduct"
 *   - type: object
 *     properties:
 *      additional_data:
 *        type: object
 *        description: Additional data to use in products hooks.
 *        additionalProperties: true
 *
 */
export const VendorUpdateProduct = WithAdditionalData(UpdateProduct)

/**
 * @schema VendorUpdateProductStatus
 * type: object
 * required:
 *   - title
 * properties:
 *   status:
 *     type: string
 *     enum: [draft, proposed, published]
 *     description: The status of the product.
 */
export type VendorUpdateProductStatusType = z.infer<
  typeof VendorUpdateProductStatus
>
export const VendorUpdateProductStatus = z.object({
  status: z.enum(['draft', 'proposed', 'published'])
})
