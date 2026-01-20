import { AttributeUIComponent } from "../attribute/common";

/**
 * @deprecated Use consolidated Attribute model with source field instead
 */
export interface CreateVendorProductAttributeDTO {
  name: string;
  value: string;
  ui_component?: AttributeUIComponent;
  extends_attribute_id?: string;
  rank?: number;
  metadata?: Record<string, unknown>;
}

/**
 * @deprecated Use consolidated Attribute model with source field instead
 */
export interface UpdateVendorProductAttributeDTO {
  id: string;
  name?: string;
  value?: string;
  ui_component?: AttributeUIComponent;
  rank?: number;
  metadata?: Record<string, unknown> | null;
}

/**
 * Input for admin-defined attributes in product creation/update
 */
export interface AdminAttributeInput {
  attribute_id: string;
  values: string[];
  use_for_variations: boolean;
}

/**
 * Input for vendor-created attributes in product creation/update
 */
export interface VendorAttributeInput {
  name: string;
  values: string[];
  use_for_variations: boolean;
  ui_component?: AttributeUIComponent;
}

/**
 * Combined attributes input for product creation additional_data
 */
export interface ProductAttributesAdditionalData {
  admin_attributes?: AdminAttributeInput[];
  vendor_attributes?: VendorAttributeInput[];
}

/**
 * Input for adding an attribute to an existing product
 */
export interface AddProductAttributeInput {
  /** Reference existing admin attribute by ID */
  attribute_id?: string;
  /** Or create/find vendor attribute by name */
  name?: string;
  values: string[];
  use_for_variations: boolean;
  ui_component?: AttributeUIComponent;
}

/**
 * Input for updating attribute values on a product
 */
export interface UpdateProductAttributeInput {
  /** For vendor-owned attributes only: update name */
  name?: string;
  /** For vendor-owned attributes only: update UI component */
  ui_component?: AttributeUIComponent;
  /** New set of values (replaces existing) */
  values?: string[];
  /** Toggle to convert attribute <-> option */
  use_for_variations?: boolean;
}
