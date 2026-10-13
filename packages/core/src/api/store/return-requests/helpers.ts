import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateCustomerReturnRequest = async (
  scope: MedusaContainer,
  customerId: string,
  id: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [request],
  } = await query.graph({
    entity: "return_request",
    fields: ["id"],
    filters: { id, customer_id: customerId },
  })

  if (!request) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Return request with id: ${id} was not found`
    )
  }
}
