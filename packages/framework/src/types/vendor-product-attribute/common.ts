import { AttributeUIComponent } from "../attribute/common";

export interface VendorProductAttributeDTO {
  id: string;
  title: string;
  value: string;
  ui_component: AttributeUIComponent;
  extends_attribute_id?: string | null;
  rank: number;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Unified informational attribute for API response
 * Combines admin AttributeValues and VendorProductAttributes
 */
export interface InformationalAttributeDTO {
  title: string;
  value: string;
  ui_component: AttributeUIComponent;
  source: "admin" | "vendor";
  /** Present if source is "admin" */
  attribute_id?: string;
  /** Present if source is "vendor" */
  vendor_attribute_id?: string;
  /** Present if vendor extended an admin attribute */
  extends_attribute_id?: string | null;
  is_filterable?: boolean;
}
