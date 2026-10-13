import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerReturnRequest = async (
  scope: MedusaContainer,
  sellerId: string,
  id: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [request],
  } = await query.graph({
    entity: "return_request",
    fields: ["id"],
    filters: { id, seller_id: sellerId },
  })

  if (!request) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Return request with id: ${id} was not found`
    )
  }
}
