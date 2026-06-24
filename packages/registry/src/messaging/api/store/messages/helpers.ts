import { MedusaContainer } from "@medusajs/framework/types"

/**
 * Resolve a human-readable label for a message context attachment.
 * Returns null if the entity cannot be found or context is not provided.
 */
export async function resolveContextLabel(
  scope: MedusaContainer,
  context_type: string | null,
  context_id: string | null
): Promise<string | null> {
  if (!context_type || !context_id) return null

  const query = scope.resolve("query")

  if (context_type === "product") {
    try {
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "title"],
        filters: { id: context_id },
      })
      if (products?.length > 0) {
        return products[0].title
      }
    } catch {
      // Product may not exist
    }
  } else if (context_type === "order") {
    try {
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "display_id"],
        filters: { id: context_id },
      })
      if (orders?.length > 0) {
        return `Order #${orders[0].display_id}`
      }
    } catch {
      // Order may not exist
    }
  }

  return null
}
