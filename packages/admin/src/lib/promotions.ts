import { HttpTypes } from "@medusajs/types"
import { i18n } from "../components/utilities/i18n"

export enum PromotionStatus {
  SCHEDULED = "SCHEDULED",
  EXPIRED = "EXPIRED",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DRAFT = "DRAFT",
}

export type StatusColors = "grey" | "orange" | "green" | "red" | "grey"

const getPromotionStatusMap = (): Record<string, [StatusColors, string]> => ({
  [PromotionStatus.ACTIVE]: ["green", i18n.t("statuses.active")],
  [PromotionStatus.INACTIVE]: ["red", i18n.t("statuses.inactive")],
  [PromotionStatus.DRAFT]: ["grey", i18n.t("statuses.draft")],
  [PromotionStatus.SCHEDULED]: [
    "orange",
    `${i18n.t("promotions.fields.campaign")} ${i18n.t("statuses.scheduled")?.toLowerCase()}`,
  ],
  [PromotionStatus.EXPIRED]: [
    "red",
    `${i18n.t("promotions.fields.campaign")} ${i18n.t("statuses.expired")?.toLowerCase()}`,
  ],
})

export const getPromotionStatus = (promotion: HttpTypes.AdminPromotion) => {
  const date = new Date()
  const campaign = promotion.campaign
  const statusMap = getPromotionStatusMap()

  if (!campaign) {
    return statusMap[promotion.status!.toUpperCase()]
  }

  if (campaign.starts_at && new Date(campaign.starts_at!) > date) {
    return statusMap[PromotionStatus.SCHEDULED]
  }

  const campaignBudget = campaign.budget
  const overBudget =
    campaignBudget &&
    campaignBudget.limit &&
    campaignBudget.used! > campaignBudget.limit!

  if ((campaign.ends_at && new Date(campaign.ends_at) < date) || overBudget) {
    return statusMap[PromotionStatus.EXPIRED]
  }

  return statusMap[promotion.status!.toUpperCase()]
}
