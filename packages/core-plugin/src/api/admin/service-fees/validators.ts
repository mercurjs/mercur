import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"
import {
  ServiceFeeType,
  ServiceFeeTarget,
  ServiceFeeChargingLevel,
  ServiceFeeStatus,
} from "@mercurjs/types"

export type AdminGetServiceFeeParamsType = z.infer<
  typeof AdminGetServiceFeeParams
>
export const AdminGetServiceFeeParams = createSelectParams()

export type AdminGetServiceFeesParamsType = z.infer<
  typeof AdminGetServiceFeesParams
>
export const AdminGetServiceFeesParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    code: z.union([z.string(), z.array(z.string())]).optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
    target: z.union([z.string(), z.array(z.string())]).optional(),
    charging_level: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    is_enabled: booleanString().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

const ServiceFeeRuleSchema = z.object({
  reference: z.string(),
  reference_id: z.string(),
  mode: z.string().optional(),
})

export type AdminCreateServiceFeeType = z.infer<typeof AdminCreateServiceFee>
export const AdminCreateServiceFee = z.object({
  name: z.string(),
  display_name: z.string(),
  code: z.string(),
  type: z.nativeEnum(ServiceFeeType),
  target: z.nativeEnum(ServiceFeeTarget).optional(),
  charging_level: z.nativeEnum(ServiceFeeChargingLevel),
  status: z.nativeEnum(ServiceFeeStatus).optional(),
  value: z.number(),
  currency_code: z.string().nullish(),
  min_amount: z.number().nullish(),
  max_amount: z.number().nullish(),
  include_tax: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
  priority: z.number().optional(),
  effective_date: z.coerce.date().nullish(),
  start_date: z.coerce.date().nullish(),
  end_date: z.coerce.date().nullish(),
  replaces_fee_id: z.string().nullish(),
  rules: z.array(ServiceFeeRuleSchema).optional(),
})

export type AdminUpdateServiceFeeType = z.infer<typeof AdminUpdateServiceFee>
export const AdminUpdateServiceFee = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  code: z.string().optional(),
  type: z.nativeEnum(ServiceFeeType).optional(),
  target: z.nativeEnum(ServiceFeeTarget).optional(),
  status: z.nativeEnum(ServiceFeeStatus).optional(),
  value: z.number().optional(),
  currency_code: z.string().nullish(),
  min_amount: z.number().nullish(),
  max_amount: z.number().nullish(),
  include_tax: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
  priority: z.number().optional(),
  effective_date: z.coerce.date().nullish(),
  start_date: z.coerce.date().nullish(),
  end_date: z.coerce.date().nullish(),
})

const UpdateServiceFeeRuleSchema = z.object({
  id: z.string(),
  reference: z.string().optional(),
  reference_id: z.string().optional(),
  mode: z.string().optional(),
})

export type AdminBatchServiceFeeRulesType = z.infer<
  typeof AdminBatchServiceFeeRules
>
export const AdminBatchServiceFeeRules = z.object({
  create: z.array(ServiceFeeRuleSchema).optional(),
  update: z.array(UpdateServiceFeeRuleSchema).optional(),
  delete: z.array(z.string()).optional(),
})

export type AdminGetServiceFeeChangeLogsParamsType = z.infer<
  typeof AdminGetServiceFeeChangeLogsParams
>
export const AdminGetServiceFeeChangeLogsParams = createFindParams({
  offset: 0,
  limit: 50,
})
