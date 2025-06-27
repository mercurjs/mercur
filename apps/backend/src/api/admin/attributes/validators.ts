import { z } from 'zod'

import { applyAndAndOrOperators } from '@medusajs/medusa/api/utils/common-validators/common'
import {
  WithAdditionalData,
  createFindParams,
  createOperatorMap,
  createSelectParams
} from '@medusajs/medusa/api/utils/validators'

enum AttributeUIComponent {
  SELECT = 'select',
  MULTIVALUE = 'multivalue',
  UNIT = 'unit',
  TOGGLE = 'toggle',
  TEXTAREA = 'text_area',
  COLOR_PICKER = 'color_picker'
}

export type AdminGetAttributeValueParamsType = z.infer<
  typeof AdminGetAttributeValueParams
>
export const AdminGetAttributeValueParams = createSelectParams()

export type AdminGetAttributeValuesParamsType = z.infer<
  typeof AdminGetAttributeValueParams
>
export const AdminGetAttributeValuesParams = createFindParams()

export type AdminGetAttributeParamsType = z.infer<
  typeof AdminGetAttributeParams
>
export const AdminGetAttributeParams = createSelectParams()

export const GetAttributesParams = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  handle: z.string().optional(),
  is_global: z.boolean().default(false),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
  ui_component: z.nativeEnum(AttributeUIComponent).optional()
})
export type AdminGetAttributesParamsType = z.infer<
  typeof AdminGetAttributesParams
>
export const AdminGetAttributesParams = createFindParams({
  offset: 0,
  limit: 50
})
  .merge(applyAndAndOrOperators(GetAttributesParams))
  .merge(GetAttributesParams)

export type AdminCreateAttributeValueType = z.infer<
  typeof AdminCreateAttributeValue
>
export const AdminCreateAttributeValue = z.object({
  value: z.string().min(1),
  rank: z.number(),
  metadata: z.record(z.unknown()).optional()
})

export type AdminUpdateAttributeValueType = z.infer<
  typeof AdminUpdateAttributeValue
>
export const AdminUpdateAttributeValue = z.object({
  id: z.string().optional(),
  value: z.string().optional(),
  rank: z.number().optional(),
  metadata: z.record(z.unknown()).optional()
})

export type AdminUpdateAttributeType = z.infer<typeof AdminUpdateAttribute>
export const AdminUpdateAttribute = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    handle: z.string().optional(),
    is_filterable: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
    ui_component: z.nativeEnum(AttributeUIComponent).optional(),
    product_category_ids: z.array(z.string()).optional(),
    possible_values: z.array(AdminUpdateAttributeValue).optional()
  })
  .strict()

export type AdminCreateAttributeType = z.infer<typeof CreateAttribute>
export const CreateAttribute = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  is_filterable: z.boolean().optional(),
  ui_component: z
    .nativeEnum(AttributeUIComponent)
    .default(AttributeUIComponent.SELECT),
  handle: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  possible_values: z.array(AdminCreateAttributeValue).optional(),
  product_category_ids: z.array(z.string()).optional()
})

export const AdminCreateAttribute = WithAdditionalData(
  CreateAttribute,
  (schema) => {
    return schema.refine(
      (data) =>
        data.ui_component !== AttributeUIComponent.SELECT ||
        (data.possible_values && data.possible_values.length > 0),
      {
        message: 'Possible values are required when ui_component is SELECT',
        path: ['possible_values']
      }
    )
  }
)
