import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const refetchShippingOptionType = async (
  scope: MedusaContainer,
  shippingOptionTypeId: string,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [shippingOptionType],
  } = await query.graph({
    entity: "shipping_option_type",
    filters: { id: shippingOptionTypeId },
    fields,
  })

  return shippingOptionType
}
