import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import categoryAttributeLink from "../../../links/category-attribute-link"

export async function getApplicableAttributes(
  container: MedusaContainer,
  product_id: string,
  fields: string[]
): Promise<any[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["categories.id"],
    filters: {
      id: product_id,
    },
  })
  const categoryIds = product.categories.map(
    (category: any) => category.id
  )

  // Fetch global attributes (not assigned to any category)
  const linkSubquery = knex(
    "product_product_category_attribute_attribute"
  )
    .select("attribute_id")
    .whereNull("deleted_at")
    .groupBy("attribute_id")

  const globalAttributeIdRows: { id: string }[] = await knex(
    "attribute as a"
  )
    .select("a.id")
    .leftJoin(linkSubquery.as("link"), "link.attribute_id", "a.id")
    .whereNull("a.deleted_at")
    .whereNull("link.attribute_id")

  const globalAttributeIds = globalAttributeIdRows.map((row) => row.id)

  const globalAttributes =
    globalAttributeIds.length > 0
      ? (
          await query.graph({
            entity: "attribute",
            fields,
            filters: {
              id: globalAttributeIds,
              deleted_at: {
                $eq: null,
              },
            },
          })
        ).data
      : []

  const { data: categoryAttributes } = await query.graph({
    entity: categoryAttributeLink.entryPoint,
    fields: fields.map((field) => `attribute.${field}`),
    filters: {
      product_category_id: categoryIds,
      deleted_at: {
        $eq: null,
      },
    },
  })

  return [
    ...globalAttributes,
    ...categoryAttributes.map((rel: any) => rel.attribute),
  ]
}
