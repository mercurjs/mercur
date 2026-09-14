import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const refetchShippingProfile = async (
  scope: MedusaContainer,
  shippingProfileId: string,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [shippingProfile],
  } = await query.graph({
    entity: "shipping_profile",
    filters: { id: shippingProfileId },
    fields,
  })

  return shippingProfile
}
