import { AttributeUIComponent } from "../attribute/common";

export interface CreateVendorProductAttributeDTO {
  title: string;
  value: string;
  ui_component?: AttributeUIComponent;
  extends_attribute_id?: string;
  rank?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateVendorProductAttributeDTO {
  id: string;
  title?: string;
  value?: string;
  ui_component?: AttributeUIComponent;
  rank?: number;
  metadata?: Record<string, unknown> | null;
}

/**
 * Input for admin-defined attributes in product creation
 */
export interface AdminAttributeInput {
  attribute_id: string;
  values: string[];
  use_for_variations: boolean;
}

/**
 * Input for vendor-created attributes in product creation
 */
export interface VendorAttributeInput {
  title: string;
  values: string[];
  use_for_variations: boolean;
  ui_component?: AttributeUIComponent;
  /** If this extends an admin attribute (for the case where vendor adds values not in possible_values) */
  extends_attribute_id?: string;
}

/**
 * Combined attributes input for product creation additional_data
 */
export interface ProductAttributesAdditionalData {
  admin_attributes?: AdminAttributeInput[];
  vendor_attributes?: VendorAttributeInput[];
}
