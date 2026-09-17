import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerCustomer = async (
  scope: MedusaContainer,
  sellerId: string,
  customerId: string | string[]
) => {
  const ids = Array.isArray(customerId) ? customerId : [customerId]

  if (ids.length === 0) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerCustomers } = await query.graph({
    entity: "seller_customer",
    filters: {
      seller_id: sellerId,
      customer_id: ids,
    },
    fields: ["customer_id"],
  })

  const ownedIds = new Set(sellerCustomers.map((row) => row.customer_id))
  const missingId = ids.find((id) => !ownedIds.has(id))

  if (missingId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id: ${missingId} was not found`
    )
  }
}
