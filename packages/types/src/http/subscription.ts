import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { SubscriptionPlanDTO, SubscriptionOverrideDTO } from "../subscription"

export interface AdminSubscriptionPlanResponse {
  subscription_plan: SubscriptionPlanDTO
}

export type AdminSubscriptionPlanListResponse = PaginatedResponse<{
  subscription_plans: SubscriptionPlanDTO[]
}>

export type AdminSubscriptionPlanDeleteResponse =
  DeleteResponse<"subscription_plan">

export interface AdminSubscriptionOverrideResponse {
  subscription_override: SubscriptionOverrideDTO
}

export type AdminSubscriptionOverrideDeleteResponse =
  DeleteResponse<"subscription_override">

export interface VendorSubscriptionResponse {
  subscription_plan: SubscriptionPlanDTO | null
  subscription_override: SubscriptionOverrideDTO | null
}
