export enum AttributeUIComponent {
  SELECT = "select",
  MULTIVALUE = "multivalue",
  UNIT = "unit",
  TOGGLE = "toggle",
  TEXTAREA = "text_area",
  COLOR_PICKER = "color_picker",
}

export const AttributeSource = {
  ADMIN: "admin",
  VENDOR: "vendor",
} as const

export type AttributeSource =
  (typeof AttributeSource)[keyof typeof AttributeSource]

export interface AttributePossibleValueDTO {
  id: string
  value: string
  rank: number
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AttributeValueDTO {
  id: string
  value: string
  rank: number
  source: AttributeSource
  metadata?: Record<string, unknown>
  attribute_id: string
  created_at: string
  updated_at: string
}

export interface AttributeDTO {
  id: string
  name: string
  description: string
  handle: string
  is_filterable: boolean
  is_required: boolean
  source: AttributeSource
  ui_component: AttributeUIComponent
  metadata?: Record<string, unknown>
  possible_values?: AttributePossibleValueDTO[]
  values?: AttributeValueDTO[]
  created_at: string
  updated_at: string
}

export interface ProductAttributeValueDTO {
  value: string
  attribute_id: string
}

export interface VendorProductAttributeDTO {
  id: string
  name: string
  value: string
  ui_component: AttributeUIComponent
  extends_attribute_id?: string | null
  rank: number
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface InformationalAttributeValueDTO {
  value: string
  source: AttributeSource
  attribute_value_id: string
  is_filterable: boolean
  is_editable: boolean
}

export interface InformationalAttributeDTO {
  attribute_id: string
  name: string
  ui_component: AttributeUIComponent
  attribute_source: AttributeSource
  is_filterable: boolean
  is_required: boolean
  is_definition_editable: boolean
  values: InformationalAttributeValueDTO[]
}
