import { AttributeUIComponent } from './common'

export interface CreateAttributeValueDTO {
  value: string
  rank: number
  attribute_id: string
  metadata?: Record<string, unknown>
}

export interface UpdateAttributeDTO {
  id: string
  name?: string
  description?: string
  handle?: string
  is_filterable?: boolean
  metadata?: Record<string, unknown>
  possible_values?: UpsertAttributeValueDTO[]
  product_category_ids?: { id: string }[]
}

export interface UpsertAttributeValueDTO {
  id?: string
  value?: string
  rank?: number
  metadata?: Record<string, unknown>
  attribute_id?: string
}

export interface CreateAttributeDTO {
  name: string
  description?: string
  handle?: string
  is_filterable?: boolean
  metadata?: Record<string, unknown>
  ui_component: AttributeUIComponent
  possible_values?: Omit<CreateAttributeValueDTO, 'attribute_id'>[]
  product_category_ids?: string[]
}

export interface UpdateAttributeValueDTO {
  id: string
  value?: string
  rank?: number
  metadata?: Record<string, unknown> | null
}

export type CreateProductAttributeValueDTO = {
  attribute_id: string
  product_id: string
  value: string
}
