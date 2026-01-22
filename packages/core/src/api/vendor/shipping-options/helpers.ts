import {
  BatchMethodResponse,
  MedusaContainer,
  ShippingOptionRuleDTO,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  promiseAll,
} from "@medusajs/framework/utils"

export const validateSellerShippingOption = async (
  scope: MedusaContainer,
  sellerId: string,
  shippingOptionId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerShippingOption],
  } = await query.graph({
    entity: "seller_shipping_option",
    filters: {
      seller_id: sellerId,
      shipping_option_id: shippingOptionId,
    },
    fields: ["seller_id"],
  })

  if (!sellerShippingOption) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Shipping option with id: ${shippingOptionId} was not found`
    )
  }
}

export const refetchShippingOption = async (
  scope: MedusaContainer,
  shippingOptionId: string,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [shippingOption],
  } = await query.graph({
    entity: "shipping_option",
    filters: { id: shippingOptionId },
    fields,
  })

  return shippingOption
}

export const refetchBatchRules = async (
  batchResult: BatchMethodResponse<ShippingOptionRuleDTO>,
  scope: MedusaContainer,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  let created = Promise.resolve<ShippingOptionRuleDTO[]>([])
  let updated = Promise.resolve<ShippingOptionRuleDTO[]>([])

  if (batchResult.created.length) {
    created = query
      .graph({
        entity: "shipping_option_rule",
        filters: { id: batchResult.created.map((p) => p.id) },
        fields,
      })
      .then(({ data }) => data)
  }

  if (batchResult.updated.length) {
    updated = query
      .graph({
        entity: "shipping_option_rule",
        filters: { id: batchResult.updated.map((p) => p.id) },
        fields,
      })
      .then(({ data }) => data)
  }

  const [createdRes, updatedRes] = await promiseAll([created, updated])
  return {
    created: createdRes,
    updated: updatedRes,
    deleted: {
      ids: batchResult.deleted,
      object: "shipping_option_rule",
      deleted: true,
    },
  }
}
