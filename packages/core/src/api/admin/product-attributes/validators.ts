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

// --- Attribute query params ---

export type AdminGetProductAttributeParamsType = z.infer<
  typeof AdminGetProductAttributeParams
>
export const AdminGetProductAttributeParams = createSelectParams()

const AdminProductAttributesParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.union([typeEnum, z.array(typeEnum)]).optional(),
  is_variant_axis: booleanString().optional(),
  is_filterable: booleanString().optional(),
  is_active: booleanString().optional(),
  category_id: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type AdminGetProductAttributesParamsType = z.infer<
  typeof AdminGetProductAttributesParams
>
export const AdminGetProductAttributesParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminProductAttributesParamsFields)
  .merge(applyAndAndOrOperators(AdminProductAttributesParamsFields))

// --- Attribute create / update ---

export type AdminCreateProductAttributeType = z.infer<
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
  category_ids: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).nullish(),
})
export const AdminCreateProductAttribute =
  WithAdditionalData(CreateProductAttribute)

export type AdminUpdateProductAttributeType = z.infer<
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
  category_ids: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).nullish(),
})
export const AdminUpdateProductAttribute =
  WithAdditionalData(UpdateProductAttribute)

// --- Attribute value query params ---

export type AdminGetProductAttributeValueParamsType = z.infer<
  typeof AdminGetProductAttributeValueParams
>
export const AdminGetProductAttributeValueParams = createSelectParams()

const AdminProductAttributeValuesParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  is_active: booleanString().optional(),
})

export type AdminGetProductAttributeValuesParamsType = z.infer<
  typeof AdminGetProductAttributeValuesParams
>
export const AdminGetProductAttributeValuesParams = createFindParams({
  offset: 0,
  limit: 100,
}).merge(AdminProductAttributeValuesParamsFields)

// --- Attribute value create / update ---

export type AdminCreateProductAttributeValueType = z.infer<
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
export const AdminCreateProductAttributeValue = WithAdditionalData(
  CreateProductAttributeValue
)

export type AdminUpdateProductAttributeValueType = z.infer<
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
export const AdminUpdateProductAttributeValue = WithAdditionalData(
  UpdateProductAttributeValue
)
