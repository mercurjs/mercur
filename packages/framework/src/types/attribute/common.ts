export enum AttributeUIComponent {
  SELECT = "select",
  MULTIVALUE = "multivalue",
  UNIT = "unit",
  TOGGLE = "toggle",
  TEXTAREA = "text_area",
  COLOR_PICKER = "color_picker",
}

export interface ProductAttributeValueDTO {
  value: string;
  attribute_id: string;
}

export interface AttributePossibleValueDTO {
  id: string;
  value: string;
  rank: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface AttributeDTO {
  id: string;
  name: string;
  description: string;
  handle: string;
  is_filterable: boolean;
  ui_component: AttributeUIComponent;
  metadata?: Record<string, unknown>;
  possible_values?: AttributePossibleValueDTO[];
  values?: Array<{
    id: string;
    value: string;
  }>;
  product_categories?: Array<{
    id: string;
    name: string;
  }>;
}
