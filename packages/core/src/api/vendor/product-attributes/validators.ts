import { z } from "zod"
import { AttributeType } from "@mercurjs/types"
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

const typeEnum = z.nativeEnum(AttributeType)

export type VendorGetProductAttributeParamsType = z.infer<
  typeof VendorGetProductAttributeParams
>
export const VendorGetProductAttributeParams = createSelectParams()

const VendorProductAttributesParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.union([typeEnum, z.array(typeEnum)]).optional(),
  is_variant_axis: booleanString().optional(),
  is_filterable: booleanString().optional(),
  is_active: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type VendorGetProductAttributesParamsType = z.infer<
  typeof VendorGetProductAttributesParams
>
export const VendorGetProductAttributesParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(VendorProductAttributesParamsFields)
  .merge(applyAndAndOrOperators(VendorProductAttributesParamsFields))

// Create / Update
export type VendorCreateProductAttributeType = z.infer<
  typeof CreateProductAttribute
> &
  AdditionalData
const CreateProductAttribute = z.object({
  name: z.string(),
  handle: z.string().optional(),
  description: z.string().optional(),
  type: typeEnum,
  is_required: z.boolean().optional(),
  is_filterable: z.boolean().optional(),
  is_variant_axis: z.boolean().optional(),
  rank: z.number().nonnegative().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})
export const VendorCreateProductAttribute =
  WithAdditionalData(CreateProductAttribute)

export type VendorUpdateProductAttributeType = z.infer<
  typeof UpdateProductAttribute
> &
  AdditionalData
const UpdateProductAttribute = z.object({
  name: z.string().optional(),
  handle: z.string().optional(),
  description: z.string().optional(),
  type: typeEnum.optional(),
  is_required: z.boolean().optional(),
  is_filterable: z.boolean().optional(),
  is_variant_axis: z.boolean().optional(),
  rank: z.number().nonnegative().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})
export const VendorUpdateProductAttribute =
  WithAdditionalData(UpdateProductAttribute)

// Value validators
export type VendorCreateProductAttributeValueType = z.infer<
  typeof CreateProductAttributeValue
> &
  AdditionalData
const CreateProductAttributeValue = z.object({
  name: z.string(),
  handle: z.string().optional(),
  rank: z.number().nonnegative().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})
export const VendorCreateProductAttributeValue = WithAdditionalData(
  CreateProductAttributeValue
)

export type VendorUpdateProductAttributeValueType = z.infer<
  typeof UpdateProductAttributeValue
> &
  AdditionalData
const UpdateProductAttributeValue = z.object({
  name: z.string().optional(),
  handle: z.string().optional(),
  rank: z.number().nonnegative().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})
export const VendorUpdateProductAttributeValue = WithAdditionalData(
  UpdateProductAttributeValue
)
