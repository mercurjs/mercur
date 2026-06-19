/**
 * Curated, crash-safe field set for the attribute batch endpoints' product
 * response. Limited to the attribute-relevant relations (native axis options +
 * non-axis value links + scoped attributes); it deliberately omits
 * variants/categories/collection, whose nested product-module populate paths
 * trip MikroORM's `expandDotPaths` on the 2.16 options-preview build.
 */
export const productAttributeBatchResponseFields = [
  "id",
  "title",
  "status",
  // NON-AXIS selected values + parent attribute + full value set.
  "product_attribute_values.id",
  "product_attribute_values.name",
  "product_attribute_values.rank",
  "product_attribute_values.attribute.id",
  "product_attribute_values.attribute.name",
  "product_attribute_values.attribute.handle",
  "product_attribute_values.attribute.type",
  "product_attribute_values.attribute.is_variant_axis",
  "product_attribute_values.attribute.is_required",
  "product_attribute_values.attribute.rank",
  "product_attribute_values.attribute.values.id",
  "product_attribute_values.attribute.values.name",
  "product_attribute_values.attribute.values.rank",
  // Product-scoped (inline) attributes via the read-only link.
  "scoped_attributes.id",
  "scoped_attributes.name",
  "scoped_attributes.handle",
  "scoped_attributes.type",
  "scoped_attributes.is_variant_axis",
  "scoped_attributes.product_option_id",
  "scoped_attributes.values.id",
  "scoped_attributes.values.name",
  "scoped_attributes.values.rank",
]
