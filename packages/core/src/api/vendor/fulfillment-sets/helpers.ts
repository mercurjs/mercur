import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const validateSellerFulfillmentSet = async (
  scope: MedusaContainer,
  sellerId: string,
  fulfillmentSetId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [locationFulfillmentSet],
  } = await query.graph({
    entity: "location_fulfillment_set",
    filters: {
      fulfillment_set_id: fulfillmentSetId,
    },
    fields: ["stock_location_id"],
  })

  if (!locationFulfillmentSet) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Fulfillment set with id: ${fulfillmentSetId} was not found`
    )
  }

  const {
    data: [sellerStockLocation],
  } = await query.graph({
    entity: "stock_location_seller",
    filters: {
      stock_location_id: locationFulfillmentSet.stock_location_id,
      seller_id: sellerId,
    },
    fields: ["seller_id"],
  })

  if (!sellerStockLocation) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Fulfillment set with id: ${fulfillmentSetId} was not found`
    )
  }
}

export const refetchFulfillmentSet = async (
  scope: MedusaContainer,
  fulfillmentSetId: string,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [fulfillmentSet],
  } = await query.graph({
    entity: "fulfillment_set",
    filters: { id: fulfillmentSetId },
    fields,
  })

  return fulfillmentSet
}

export const validateSellerServiceZone = async (
  scope: MedusaContainer,
  sellerId: string,
  serviceZoneId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [serviceZone],
  } = await query.graph({
    entity: "service_zone",
    filters: { id: serviceZoneId },
    fields: ["id", "fulfillment_set_id"],
  })

  if (!serviceZone?.fulfillment_set_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Service zone with id: ${serviceZoneId} was not found`
    )
  }

  try {
    await validateSellerFulfillmentSet(
      scope,
      sellerId,
      serviceZone.fulfillment_set_id
    )
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Service zone with id: ${serviceZoneId} was not found`
    )
  }
}
