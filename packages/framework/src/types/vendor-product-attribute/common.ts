import { AttributeSource, AttributeUIComponent } from "../attribute/common";

/**
 * @deprecated Use AttributeValueDTO with source field instead
 */
export interface VendorProductAttributeDTO {
  id: string;
  name: string;
  value: string;
  ui_component: AttributeUIComponent;
  extends_attribute_id?: string | null;
  rank: number;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Detailed value information for informational attributes
 * Allows client to identify source and ID for each value
 */
export interface InformationalAttributeValueDTO {
  value: string;
  source: AttributeSource;
  /** ID of the attribute_value */
  attribute_value_id: string;
  /** Whether this value can be filtered on the store (admin source + filterable attribute) */
  is_filterable: boolean;
  /** Whether this value can be edited/deleted by the current vendor */
  is_editable: boolean;
}

/**
 * Unified informational attribute for API response
 * Uses consolidated Attribute model with source tracking at both levels
 */
export interface InformationalAttributeDTO {
  /** Attribute definition ID */
  attribute_id: string;
  name: string;
  ui_component: AttributeUIComponent;
  /** Source of the attribute definition */
  attribute_source: AttributeSource;
  /** Whether the attribute definition is filterable (admin only) */
  is_filterable: boolean;
  /** Whether this attribute is required (admin only) */
  is_required: boolean;
  /** Whether the vendor can edit the attribute definition (name, ui_component) */
  is_definition_editable: boolean;
  /** Values assigned to this product */
  values: InformationalAttributeValueDTO[];
}
