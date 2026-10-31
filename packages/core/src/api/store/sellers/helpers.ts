import { MedusaRequest } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { SellerStatus } from "@mercurjs/types"

export const getSellerOpenFilters = () => {
  const now = new Date()

  return {
    status: SellerStatus.OPEN,
    $and: [
      { $or: [{ closed_from: null }, { closed_from: { $gt: now } }] },
      { $or: [{ closed_to: null }, { closed_to: { $lt: now } }] },
    ],
  }
}

export const validateSellerVisibility = async (
  req: MedusaRequest<unknown>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { id: req.params.id, ...getSellerOpenFilters() },
  })

  if (!seller) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Seller with id: ${req.params.id} was not found`
    )
  }
}
