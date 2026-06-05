import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

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

export const validateSellerShippingProfile = async (
  scope: MedusaContainer,
  sellerId: string,
  shippingProfileId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerShippingProfile],
  } = await query.graph({
    entity: "shipping_profile_seller",
    filters: {
      seller_id: sellerId,
      shipping_profile_id: shippingProfileId,
    },
    fields: ["seller_id"],
  })

  if (!sellerShippingProfile) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Shipping profile with id: ${shippingProfileId} was not found`
    )
  }
}
