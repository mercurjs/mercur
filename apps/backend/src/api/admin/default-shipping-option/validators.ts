import { z } from 'zod'

/**
 * @schema AdminCreateDefaultSippingOption
 * type: object
 * properties:
 *   id:
 *     type: string
 *     description: The external id from easypost api.
 */
export type AdminCreateDefaultShippingOptionType = z.infer<
  typeof AdminCreateDefaultSippingOption
>
export const AdminCreateDefaultSippingOption = z.object({
  id: z.string()
})
