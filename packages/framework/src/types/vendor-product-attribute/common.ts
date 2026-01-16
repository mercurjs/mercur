import { AttributeUIComponent } from "../attribute/common";

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
 * Unified informational attribute for API response
 * Combines admin AttributeValues and VendorProductAttributes merged by name
 */
export interface InformationalAttributeDTO {
  name: string;
  values: string[];
  ui_component: AttributeUIComponent;
  source: "admin" | "vendor" | "mixed";
  /** Present if source includes admin attributes */
  attribute_id?: string;
  /** Present if source includes vendor attributes */
  vendor_attribute_ids?: string[];
  /** Present if vendor extended an admin attribute */
  extends_attribute_id?: string | null;
  is_filterable: boolean;
}
