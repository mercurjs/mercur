import {
  BatchMethodResponse,
  MedusaContainer,
  PromotionRuleDTO,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  promiseAll,
  RuleType,
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
  await validateSellerPromotions(scope, sellerId, [promotionId])
}

export const validateSellerPromotions = async (
  scope: MedusaContainer,
  sellerId: string,
  promotionIds: string[]
) => {
  if (!promotionIds.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerPromotions } = await query.graph({
    entity: "promotion_seller",
    filters: {
      seller_id: sellerId,
      promotion_id: promotionIds,
    },
    fields: ["promotion_id"],
  })

  const foundIds = new Set(sellerPromotions.map((sp: any) => sp.promotion_id))

  for (const promotionId of promotionIds) {
    if (!foundIds.has(promotionId)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Promotion with id: ${promotionId} was not found`
      )
    }
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

export const validatePromotionRules = async (
  scope: MedusaContainer,
  promotionId: string,
  ruleType: RuleType,
  ruleIds: string[]
) => {
  const ids = Array.from(new Set(ruleIds))
  if (!ids.length) {
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [promotion],
  } = await query.graph({
    entity: "promotion",
    filters: { id: promotionId },
    fields: [
      "id",
      "rules.id",
      "application_method.buy_rules.id",
      "application_method.target_rules.id",
    ],
  })

  type RuleRef = { id: string }
  const rules: RuleRef[] =
    ruleType === RuleType.RULES
      ? promotion?.rules ?? []
      : ruleType === RuleType.BUY_RULES
        ? promotion?.application_method?.buy_rules ?? []
        : promotion?.application_method?.target_rules ?? []

  const owned = new Set(rules.map((rule) => rule.id))
  const missing = ids.find((id) => !owned.has(id))

  if (missing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Promotion rule with id: ${missing} was not found`
    )
  }
}
