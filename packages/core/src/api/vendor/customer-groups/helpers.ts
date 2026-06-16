import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const refetchCustomerGroup = async (
  customerGroupId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [customerGroup],
  } = await query.graph({
    entity: "customer_group",
    filters: { id: customerGroupId },
    fields,
  })

  return customerGroup
}

export const validateSellerCustomerGroup = async (
  scope: MedusaContainer,
  sellerId: string,
  customerGroupId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerCustomerGroup],
  } = await query.graph({
    entity: "seller_customer_group",
    filters: {
      seller_id: sellerId,
      customer_group_id: customerGroupId,
    },
    fields: ["seller_id", "customer_group_id"],
  })

  if (!sellerCustomerGroup) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer group with id: ${customerGroupId} was not found`
    )
  }
}
