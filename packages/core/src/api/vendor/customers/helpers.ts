import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerCustomer = async (
  scope: MedusaContainer,
  sellerId: string,
  customerId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerCustomer],
  } = await query.graph({
    entity: "seller_customer",
    filters: {
      seller_id: sellerId,
      customer_id: customerId,
    },
    fields: ["seller_id", "customer_id"],
  })

  if (!sellerCustomer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id: ${customerId} was not found`
    )
  }
}
