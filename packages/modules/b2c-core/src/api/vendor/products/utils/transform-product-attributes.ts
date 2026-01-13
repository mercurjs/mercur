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
  name: string;
  value: string;
  ui_component: string;
  extends_attribute_id?: string | null;
}

interface ProductWithAttributes {
  attribute_values?: AttributeValueWithAttribute[];
  vendor_product_attributes?: VendorProductAttribute[];
  [key: string]: unknown;
}

const toInformationalAttributeFromAdmin = (
  attributeValue: AttributeValueWithAttribute
): InformationalAttributeDTO => ({
  name: attributeValue.attribute.name,
  value: attributeValue.value,
  ui_component: attributeValue.attribute.ui_component as AttributeUIComponent,
  source: "admin",
  attribute_id: attributeValue.attribute.id,
  is_filterable: attributeValue.attribute.is_filterable,
});

const toInformationalAttributeFromVendor = (
  vendorAttribute: VendorProductAttribute
): InformationalAttributeDTO => ({
  name: vendorAttribute.name,
  value: vendorAttribute.value,
  ui_component: vendorAttribute.ui_component as AttributeUIComponent,
  source: "vendor",
  vendor_attribute_id: vendorAttribute.id,
  extends_attribute_id: vendorAttribute.extends_attribute_id,
  is_filterable: false,
});

export function transformProductWithInformationalAttributes<
  T extends ProductWithAttributes
>(product: T): T & { informational_attributes: InformationalAttributeDTO[] } {
  const informationalAttributes: InformationalAttributeDTO[] = [
    ...(product.attribute_values?.map(toInformationalAttributeFromAdmin) ?? []),
    ...(product.vendor_product_attributes?.map(
      toInformationalAttributeFromVendor
    ) ?? []),
  ];

  return {
    ...product,
    informational_attributes: informationalAttributes,
  };
}

export function transformProductsWithInformationalAttributes<
  T extends ProductWithAttributes
>(products: T[]): (T & { informational_attributes: InformationalAttributeDTO[] })[] {
  return products.map(transformProductWithInformationalAttributes);
}
