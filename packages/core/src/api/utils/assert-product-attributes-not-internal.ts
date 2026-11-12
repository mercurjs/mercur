import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

type AttributeFlags = { id: string; name: string; is_internal: boolean }

export async function assertProductAttributesNotInternal(
  scope: MedusaContainer,
  attributeIds: string[]
): Promise<void> {
  const ids = Array.from(new Set(attributeIds.filter(Boolean)))
  if (!ids.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_attribute",
    fields: ["id", "name", "is_internal"],
    filters: { id: ids },
  })

  const internal = (data as AttributeFlags[]).filter((a) => a.is_internal)
  if (internal.length > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Attribute(s) ${internal
        .map((a) => a.name)
        .join(", ")} are internal and cannot be modified by sellers.`
    )
  }
}
