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
  customerGroupId: string | string[]
) => {
  const ids = Array.isArray(customerGroupId)
    ? customerGroupId
    : [customerGroupId]

  if (ids.length === 0) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerCustomerGroups } = await query.graph({
    entity: "customer_group_seller",
    filters: {
      seller_id: sellerId,
      customer_group_id: ids,
    },
    fields: ["customer_group_id"],
  })

  const ownedIds = new Set(
    sellerCustomerGroups.map((row) => row.customer_group_id)
  )
  const missingId = ids.find((id) => !ownedIds.has(id))

  if (missingId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer group with id: ${missingId} was not found`
    )
  }
}
