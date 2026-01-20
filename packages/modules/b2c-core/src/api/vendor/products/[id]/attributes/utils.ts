import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export interface ProductAttributeValueRow {
  attribute_value_id: string;
  value: string;
  source: string;
}

/**
 * Efficiently fetches attribute values for a product filtered by attribute_id
 * using a direct SQL join query instead of Query's graph method.
 */
export async function getProductAttributeValues(
  container: MedusaContainer,
  productId: string,
  attributeId: string
): Promise<ProductAttributeValueRow[]> {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const rows = await knex("product_product_attribute_attribute_value as link")
    .select("av.id as attribute_value_id", "av.value", "av.source")
    .innerJoin("attribute_value as av", "link.attribute_value_id", "av.id")
    .where("link.product_id", productId)
    .where("av.attribute_id", attributeId)
    .whereNull("link.deleted_at")
    .whereNull("av.deleted_at");

  return rows;
}
