import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const refetchOffer = async (
  offerId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [offer],
  } = await query.graph({
    entity: "offer",
    filters: { id: offerId },
    fields,
  })

  return offer
}

export const validateSellerOffer = async (
  scope: MedusaContainer,
  sellerId: string,
  offerId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [offer],
  } = await query.graph({
    entity: "offer",
    filters: { id: offerId, seller_id: sellerId },
    fields: ["id"],
  })

  if (!offer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer with id: ${offerId} was not found`
    )
  }
}
