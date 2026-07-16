import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Reads a boolean flag off the singleton store's metadata. When the key is
// absent (or not a boolean) the caller's fallback decides the default, which
// lets each setting keep its own backward-compatible behaviour.
export const resolveStoreBooleanSetting = async (
  container: MedusaContainer,
  key: string,
  fallback: () => boolean | Promise<boolean>
): Promise<boolean> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [store],
  } = await query.graph({
    entity: "store",
    fields: ["id", "metadata"],
  })

  const setting = store?.metadata?.[key]

  return typeof setting === "boolean" ? setting : fallback()
}
