import {
  AttributeUIComponent,
  InformationalAttributeDTO,
} from "@mercurjs/framework";

interface AttributeValueWithAttribute {
  id: string;
  value: string;
  attribute: {
    id: string;
    name: string;
    ui_component: string;
    is_filterable: boolean;
  };
}

interface VendorProductAttribute {
  id: string;
  title: string;
  value: string;
  ui_component: string;
  extends_attribute_id?: string | null;
}

interface ProductWithAttributes {
  attribute_values?: AttributeValueWithAttribute[];
  vendor_product_attributes?: VendorProductAttribute[];
  [key: string]: unknown;
}

interface TransformedProduct extends Omit<ProductWithAttributes, 'attribute_values' | 'vendor_product_attributes'> {
  informational_attributes: InformationalAttributeDTO[];
  attribute_values?: AttributeValueWithAttribute[];
  vendor_product_attributes?: VendorProductAttribute[];
}

/**
 * Transforms a product to include a unified `informational_attributes` array
 * that merges admin AttributeValues and VendorProductAttributes
 */
export function transformProductWithInformationalAttributes<
  T extends ProductWithAttributes
>(product: T): T & { informational_attributes: InformationalAttributeDTO[] } {
  const informationalAttributes: InformationalAttributeDTO[] = [];

  // Add admin attribute values
  if (product.attribute_values) {
    for (const attrVal of product.attribute_values) {
      informationalAttributes.push({
        title: attrVal.attribute.name,
        value: attrVal.value,
        ui_component: attrVal.attribute.ui_component as AttributeUIComponent,
        source: "admin",
        attribute_id: attrVal.attribute.id,
        is_filterable: attrVal.attribute.is_filterable,
      });
    }
  }

  // Add vendor product attributes
  if (product.vendor_product_attributes) {
    for (const vendorAttr of product.vendor_product_attributes) {
      informationalAttributes.push({
        title: vendorAttr.title,
        value: vendorAttr.value,
        ui_component: vendorAttr.ui_component as AttributeUIComponent,
        source: "vendor",
        vendor_attribute_id: vendorAttr.id,
        extends_attribute_id: vendorAttr.extends_attribute_id,
        is_filterable: false, // Vendor attributes are not filterable
      });
    }
  }

  return {
    ...product,
    informational_attributes: informationalAttributes,
  };
}

/**
 * Transforms an array of products to include informational_attributes
 */
export function transformProductsWithInformationalAttributes<
  T extends ProductWithAttributes
>(products: T[]): (T & { informational_attributes: InformationalAttributeDTO[] })[] {
  return products.map(transformProductWithInformationalAttributes);
}
