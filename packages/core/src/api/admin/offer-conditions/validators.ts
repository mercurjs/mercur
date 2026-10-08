import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type AdminGetOfferConditionParamsType = z.infer<
  typeof AdminGetOfferConditionParams
>
export const AdminGetOfferConditionParams = createSelectParams()

export type AdminGetOfferConditionsParamsType = z.infer<
  typeof AdminGetOfferConditionsParams
>
export const AdminGetOfferConditionsParams = createFindParams({
  offset: 0,
  limit: 50,
  order: "rank",
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    code: z.union([z.string(), z.array(z.string())]).optional(),
    is_active: booleanString().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type AdminCreateOfferConditionType = z.infer<
  typeof AdminCreateOfferCondition
>
export const AdminCreateOfferCondition = z
  .object({
    code: z.string().min(1),
    label: z.string().min(1),
    is_active: z.boolean().optional(),
    rank: z.number().int().min(0).optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

export type AdminUpdateOfferConditionType = z.infer<
  typeof AdminUpdateOfferCondition
>
export const AdminUpdateOfferCondition = z
  .object({
    code: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    is_active: z.boolean().optional(),
    rank: z.number().int().min(0).optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()
