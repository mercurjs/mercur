import { z } from 'zod'

export type StoreDeleteCartShippingMethodsType = z.infer<
  typeof StoreDeleteCartShippingMethods
>
export const StoreDeleteCartShippingMethods = z.object({
  shipping_method_ids: z.array(z.string())
})

export type StoreAddCartShippingMethodsWithSellerType = z.infer<
  typeof StoreAddCartShippingMethodsWithSeller
>
export const StoreAddCartShippingMethodsWithSeller = z.object({
  option_id: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
  seller_id: z.string().optional()
})
