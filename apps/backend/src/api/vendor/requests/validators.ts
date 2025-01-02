import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

import { VendorCreateProduct } from '../products/validators'

export type VendorGetRequestsParamsType = z.infer<
  typeof VendorGetRequestsParams
>
export const VendorGetRequestsParams = createFindParams({
  offset: 0,
  limit: 50
})

const ProductCategoryRequest = z.object({
  type: z.literal('product_category'),
  data: z.object({
    name: z.string(),
    description: z.string().optional(),
    parent_category_id: z.string().nullable()
  })
})

const ProductCollectionRequest = z.object({
  type: z.literal('product_collection'),
  data: z.object({
    title: z.string()
  })
})

const ProductRequest = z.object({
  type: z.literal('product'),
  data: VendorCreateProduct
})

export type VendorCreateRequestType = z.infer<typeof VendorCreateRequest>
export const VendorCreateRequest = z.object({
  request: z.discriminatedUnion('type', [
    ProductCategoryRequest,
    ProductCollectionRequest,
    ProductRequest
  ])
})
