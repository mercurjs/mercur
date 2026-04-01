export interface ProductAttributePossibleValue {
  id: string
  value: string
  rank: number
  metadata?: Record<string, any>
  attribute_id?: string
}

export interface ProductOptionMetadata {
  author?: string
  attribute_id?: string
  [key: string]: unknown
}

export interface ProductInformationalAttributeValue {
  value: string
  source: "vendor" | "admin"
  attribute_value_id: string
  is_filterable: boolean
  is_editable: boolean
}

export interface ProductInformationalAttribute {
  attribute_id: string
  description?: string | null
  is_filterable: boolean
  is_required?: boolean
  attribute_source: "vendor" | "admin"
  source?: "vendor" | "admin"
  is_definition_editable?: boolean
  name: string
  ui_component: string
  values: ProductInformationalAttributeValue[]
}

export interface ExtendedAdminProductOption {
  id: string
  title: string
  values?: Array<{ id: string; value: string }>
  metadata?: ProductOptionMetadata | null
}

export interface ExtendedAdminProduct {
  id: string
  title: string
  options?: ExtendedAdminProductOption[]
  informational_attributes?: ProductInformationalAttribute[]
  [key: string]: any
}

export interface ProductAttribute {
  id: string
  name: string
  description?: string
  handle: string
  is_filterable: boolean
  is_required: boolean
  ui_component:
    | "toggle"
    | "select"
    | "text"
    | "text_area"
    | "unit"
    | "multivalue"
    | "color_picker"
  metadata?: Record<string, any>
  possible_values: ProductAttributePossibleValue[]
  product_categories?: Array<{ id: string; name: string }>
}
