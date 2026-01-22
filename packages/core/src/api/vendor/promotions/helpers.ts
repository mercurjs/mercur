import {
  BatchMethodResponse,
  MedusaContainer,
  PromotionRuleDTO,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  promiseAll,
} from "@medusajs/framework/utils"

export const refetchPromotion = async (
  promotionId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [promotion],
  } = await query.graph({
    entity: "promotion",
    filters: { id: promotionId },
    fields,
  })

  return promotion
}

export const validateSellerPromotion = async (
  scope: MedusaContainer,
  sellerId: string,
  promotionId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerPromotion],
  } = await query.graph({
    entity: "seller_promotion",
    filters: {
      seller_id: sellerId,
      promotion_id: promotionId,
    },
    fields: ["seller_id"],
  })

  if (!sellerPromotion) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Promotion with id: ${promotionId} was not found`
    )
  }
}

export const refetchBatchRules = async (
  batchResult: BatchMethodResponse<PromotionRuleDTO>,
  scope: MedusaContainer,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  let created = Promise.resolve<PromotionRuleDTO[]>([])
  let updated = Promise.resolve<PromotionRuleDTO[]>([])

  if (batchResult.created.length) {
    created = query.graph({
      entity: "promotion_rule",
      filters: { id: batchResult.created.map((p) => p.id) },
      fields,
    }).then((res: any) => res.data)
  }

  if (batchResult.updated.length) {
    updated = query.graph({
      entity: "promotion_rule",
      filters: { id: batchResult.updated.map((p) => p.id) },
      fields,
    }).then((res: any) => res.data)
  }

  const [createdRes, updatedRes] = await promiseAll([created, updated])

  return {
    created: createdRes,
    updated: updatedRes,
    deleted: {
      ids: batchResult.deleted,
      object: "promotion-rule",
      deleted: true,
    },
  }
}
