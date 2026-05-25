import { z } from "zod"
import { AttributeType } from "@mercurjs/types"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import {
  applyAndAndOrOperators,
  booleanString,
} from "@medusajs/medusa/api/utils/common-validators/common"

const typeEnum = z.nativeEnum(AttributeType)

export type StoreGetProductAttributeParamsType = z.infer<typeof StoreGetProductAttributeParams>
export const StoreGetProductAttributeParams = createSelectParams()

const StoreProductAttributesParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.union([typeEnum, z.array(typeEnum)]).optional(),
  is_variant_axis: booleanString().optional(),
  is_filterable: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type StoreGetProductAttributesParamsType = z.infer<typeof StoreGetProductAttributesParams>
export const StoreGetProductAttributesParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(StoreProductAttributesParamsFields)
  .merge(applyAndAndOrOperators(StoreProductAttributesParamsFields))
