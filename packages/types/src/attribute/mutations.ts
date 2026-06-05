import { AttributeSource, AttributeUIComponent } from "./common"

export interface CreateAttributeValueDTO {
  value: string
  rank: number
  attribute_id: string
  source?: AttributeSource
  metadata?: Record<string, unknown>
}

export interface UpdateAttributeDTO {
  id: string
  name?: string
  description?: string
  handle?: string
  is_filterable?: boolean
  is_required?: boolean
  metadata?: Record<string, unknown>
  possible_values?: UpsertAttributeValueDTO[]
  product_category_ids?: { id: string }[]
}

export interface UpsertAttributeValueDTO {
  id?: string
  value?: string
  rank?: number
  source?: AttributeSource
  metadata?: Record<string, unknown>
  attribute_id?: string
}

export interface CreateAttributeDTO {
  name: string
  description?: string
  handle?: string
  is_filterable?: boolean
  is_required?: boolean
  source?: AttributeSource
  metadata?: Record<string, unknown>
  ui_component: AttributeUIComponent
  possible_values?: Omit<CreateAttributeValueDTO, "attribute_id">[]
  product_category_ids?: string[]
}

export interface UpdateAttributeValueDTO {
  id: string
  value?: string
  rank?: number
  source?: AttributeSource
  metadata?: Record<string, unknown> | null
}

export type CreateProductAttributeValueDTO = {
  attribute_id: string
  product_id: string
  value: string
  source?: AttributeSource
}

export interface AdminAttributeInput {
  attribute_id: string
  values: string[]
  use_for_variations: boolean
}

export interface VendorAttributeInput {
  name: string
  values: string[]
  use_for_variations: boolean
  ui_component?: AttributeUIComponent
}

export interface ProductAttributesAdditionalData {
  admin_attributes?: AdminAttributeInput[]
  vendor_attributes?: VendorAttributeInput[]
}

export interface AddProductAttributeInput {
  attribute_id?: string
  name?: string
  values: string[]
  use_for_variations: boolean
  ui_component?: AttributeUIComponent
}

export interface UpdateProductAttributeInput {
  name?: string
  ui_component?: AttributeUIComponent
  values?: string[]
  use_for_variations?: boolean
}

export interface CreateVendorProductAttributeDTO {
  name: string
  value: string
  ui_component?: AttributeUIComponent
  extends_attribute_id?: string
  rank?: number
  metadata?: Record<string, unknown>
}

export interface UpdateVendorProductAttributeDTO {
  id: string
  name?: string
  value?: string
  ui_component?: AttributeUIComponent
  rank?: number
  metadata?: Record<string, unknown> | null
}
