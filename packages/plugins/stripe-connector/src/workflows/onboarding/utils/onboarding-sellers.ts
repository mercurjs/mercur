import { SellerStatus } from "@mercurjs/types"

export const ONBOARDING_CHECKPOINT = "onboarding"
export const ONBOARDING_PAGE = 100

export const onboardingSellerFilters = (sellerIds: string[] | undefined, checkpoint: string | null) => ({
  status: [SellerStatus.OPEN, SellerStatus.PENDING_APPROVAL],
  ...(sellerIds ? { id: sellerIds } : {}),
  ...(!sellerIds && checkpoint ? { updated_at: { $gt: new Date(checkpoint) } } : {}),
})
