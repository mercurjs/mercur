import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

import { VendorCreateProduct } from '../products/validators'

export type VendorGetRequestsParamsType = z.infer<
  typeof VendorGetRequestsParams
>
export const VendorGetRequestsParams = createFindParams({
  offset: 0,
  limit: 50
}).extend({
  type: z
    .enum([
      'product_collection',
      'product_category',
      'product',
      'review_remove',
      'product_type'
    ])
    .optional(),
  status: z.enum(['accepted', 'rejected', 'pending']).optional()
})

/**
 * @schema ProductCategoryRequest
 * type: object
 * required:
 *   - type
 *   - data
 * properties:
 *   type:
 *     type: string
 *     description: The type of the request
 *     enum: [product_category]
 *   data:
 *     type: object
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the product category
 *       handle:
 *         type: string
 *         description: The description of the product category
 *       description:
 *         type: string
 *         description: The description of the product category
 *       parent_category_id:
 *         type: string
 *         description: The id of the parent category
 */
const ProductCategoryRequest = z.object({
  type: z.literal('product_category'),
  data: z.object({
    name: z.string(),
    handle: z.string(),
    description: z.string().optional(),
    parent_category_id: z.string().nullable()
  })
})

/**
 * @schema ProductCollectionRequest
 * type: object
 * required:
 *   - type
 *   - data
 * properties:
 *   type:
 *     type: string
 *     description: The type of the request
 *     enum: [product_collection]
 *   data:
 *     type: object
 *     properties:
 *       title:
 *         type: string
 *         description: The title of the product collection
 *       handle:
 *         type: string
 *         description: The description of the product category
 */
const ProductCollectionRequest = z.object({
  type: z.literal('product_collection'),
  data: z.object({
    title: z.string(),
    handle: z.string()
  })
})

/**
 * @schema ProductRequest
 * type: object
 * required:
 *   - type
 *   - data
 * properties:
 *   type:
 *     type: string
 *     description: The type of the request
 *     enum: [product]
 *   data:
 *     $ref: "#/components/schemas/VendorCreateProduct"
 */
const ProductRequest = z.object({
  type: z.literal('product'),
  data: VendorCreateProduct
})

/**
 * @schema ReviewRemoveRequest
 * type: object
 * required:
 *   - type
 *   - data
 * properties:
 *   type:
 *     type: string
 *     description: The type of the request
 *     enum: [review_remove]
 *   data:
 *     type: object
 *     properties:
 *       review_id:
 *         type: string
 *         description: Id of the review to remove
 *       reason:
 *         type: string
 *         description: The reason to remove review
 */
const ReviewRemoveRequest = z.object({
  type: z.literal('review_remove'),
  data: z.object({
    review_id: z.string(),
    reason: z.string()
  })
})

/**
 * @schema ProductTypeRequest
 * type: object
 * required:
 *   - type
 *   - data
 * properties:
 *   type:
 *     type: string
 *     description: The type of the request
 *     enum: [product_type]
 *   data:
 *     type: object
 *     properties:
 *       value:
 *         type: string
 *         description: The product type value
 *       metadata:
 *         type: object
 *         description: The product type metadata
 */
const ProductTypeRequest = z.object({
  type: z.literal('product_type'),
  data: z.object({
    value: z.string(),
    metadata: z.record(z.unknown()).nullish()
  })
})

/**
 * @schema VendorCreateRequest
 * type: object
 * required:
 *   - request
 * properties:
 *   request:
 *     type: object
 *     description: The resource to be created by request
 *     oneOf:
 *       - $ref: "#/components/schemas/ProductRequest"
 *       - $ref: "#/components/schemas/ProductCollectionRequest"
 *       - $ref: "#/components/schemas/ProductCategoryRequest"
 *       - $ref: "#/components/schemas/ReviewRemoveRequest"
 *       - $ref: "#/components/schemas/ProductTypeRequest"
 */
export type VendorCreateRequestType = z.infer<typeof VendorCreateRequest>
export const VendorCreateRequest = z.object({
  request: z.discriminatedUnion('type', [
    ProductCategoryRequest,
    ProductCollectionRequest,
    ProductRequest,
    ReviewRemoveRequest,
    ProductTypeRequest
  ])
})
