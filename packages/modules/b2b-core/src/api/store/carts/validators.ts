import { z } from 'zod'

export type StoreDeleteCartShippingMethodsType = z.infer<
  typeof StoreDeleteCartShippingMethods
>
export const StoreDeleteCartShippingMethods = z.object({
  shipping_method_ids: z.array(z.string())
})
