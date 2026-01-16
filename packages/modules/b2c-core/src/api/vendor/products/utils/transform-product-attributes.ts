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

interface AttributeAccumulator {
  values: string[];
  ui_component: AttributeUIComponent;
  hasAdmin: boolean;
  hasVendor: boolean;
  attribute_id?: string;
  vendor_attribute_ids: string[];
  extends_attribute_id?: string | null;
  is_filterable: boolean;
}

function mergeAttributes(
  adminAttributes: AttributeValueWithAttribute[],
  vendorAttributes: VendorProductAttribute[]
): InformationalAttributeDTO[] {
  const attributeMap = new Map<string, AttributeAccumulator>();

  for (const attr of adminAttributes) {
    const name = attr.attribute.name;
    const existing = attributeMap.get(name);

    if (existing) {
      existing.values.push(attr.value);
      existing.hasAdmin = true;
      existing.attribute_id = attr.attribute.id;
      existing.is_filterable = existing.is_filterable || attr.attribute.is_filterable;
    } else {
      attributeMap.set(name, {
        values: [attr.value],
        ui_component: attr.attribute.ui_component as AttributeUIComponent,
        hasAdmin: true,
        hasVendor: false,
        attribute_id: attr.attribute.id,
        vendor_attribute_ids: [],
        is_filterable: attr.attribute.is_filterable,
      });
    }
  }

  for (const attr of vendorAttributes) {
    const name = attr.name;
    const existing = attributeMap.get(name);

    if (existing) {
      existing.values.push(attr.value);
      existing.hasVendor = true;
      existing.vendor_attribute_ids.push(attr.id);
      if (attr.extends_attribute_id) {
        existing.extends_attribute_id = attr.extends_attribute_id;
      }
    } else {
      attributeMap.set(name, {
        values: [attr.value],
        ui_component: attr.ui_component as AttributeUIComponent,
        hasAdmin: false,
        hasVendor: true,
        vendor_attribute_ids: [attr.id],
        extends_attribute_id: attr.extends_attribute_id,
        is_filterable: false,
      });
    }
  }

  const result: InformationalAttributeDTO[] = [];

  for (const [name, acc] of attributeMap) {
    const source: "admin" | "vendor" | "mixed" =
      acc.hasAdmin && acc.hasVendor ? "mixed" : acc.hasAdmin ? "admin" : "vendor";

    const dto: InformationalAttributeDTO = {
      name,
      values: acc.values,
      ui_component: acc.ui_component,
      source,
      is_filterable: acc.is_filterable,
    };

    if (acc.attribute_id) {
      dto.attribute_id = acc.attribute_id;
    }

    if (acc.vendor_attribute_ids.length > 0) {
      dto.vendor_attribute_ids = acc.vendor_attribute_ids;
    }

    if (acc.extends_attribute_id) {
      dto.extends_attribute_id = acc.extends_attribute_id;
    }

    result.push(dto);
  }

  return result;
}

export function transformProductWithInformationalAttributes<
  T extends ProductWithAttributes
>(product: T): T & { informational_attributes: InformationalAttributeDTO[] } {
  const informationalAttributes = mergeAttributes(
    product.attribute_values ?? [],
    product.vendor_product_attributes ?? []
  );

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
