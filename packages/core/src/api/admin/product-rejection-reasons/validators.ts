import { z } from "zod"
import { RejectionReasonType } from "@mercurjs/types"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import {
  applyAndAndOrOperators,
  booleanString,
} from "@medusajs/medusa/api/utils/common-validators/common"
import { AdditionalData } from "@medusajs/framework/types"

const typeEnum = z.nativeEnum(RejectionReasonType)

export type AdminGetProductRejectionReasonParamsType = z.infer<
  typeof AdminGetProductRejectionReasonParams
>
export const AdminGetProductRejectionReasonParams = createSelectParams()

const AdminProductRejectionReasonsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  code: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.union([typeEnum, z.array(typeEnum)]).optional(),
  is_active: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type AdminGetProductRejectionReasonsParamsType = z.infer<
  typeof AdminGetProductRejectionReasonsParams
>
export const AdminGetProductRejectionReasonsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminProductRejectionReasonsParamsFields)
  .merge(applyAndAndOrOperators(AdminProductRejectionReasonsParamsFields))

export type AdminCreateProductRejectionReasonType = z.infer<
  typeof CreateProductRejectionReason
> &
  AdditionalData
const CreateProductRejectionReason = z.object({
  code: z.string(),
  label: z.string(),
  type: typeEnum,
  is_active: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})
export const AdminCreateProductRejectionReason = WithAdditionalData(
  CreateProductRejectionReason
)

export type AdminUpdateProductRejectionReasonType = z.infer<
  typeof UpdateProductRejectionReason
> &
  AdditionalData
const UpdateProductRejectionReason = z.object({
  label: z.string().optional(),
  type: typeEnum.optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})
export const AdminUpdateProductRejectionReason = WithAdditionalData(
  UpdateProductRejectionReason
)
