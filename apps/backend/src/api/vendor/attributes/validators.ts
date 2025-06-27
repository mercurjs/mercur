import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

import { AttributeUIComponent } from '@mercurjs/framework'

export type VendorGetAttributesParamsType = z.infer<
  typeof VendorGetAttributesParams
>
export const VendorGetAttributesParams = createFindParams({
  offset: 0,
  limit: 50
}).merge(
  z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    handle: z.string().optional(),
    ui_component: z.nativeEnum(AttributeUIComponent).optional()
  })
)
