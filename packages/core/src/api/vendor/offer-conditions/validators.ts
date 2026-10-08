import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetOfferConditionParamsType = z.infer<
  typeof VendorGetOfferConditionParams
>
export const VendorGetOfferConditionParams = createSelectParams()

export type VendorGetOfferConditionsParamsType = z.infer<
  typeof VendorGetOfferConditionsParams
>
export const VendorGetOfferConditionsParams = createFindParams({
  offset: 0,
  limit: 50,
  order: "rank",
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    code: z.union([z.string(), z.array(z.string())]).optional(),
  })
)
