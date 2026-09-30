import { useCan } from "@mercurjs/dashboard-shared"

import { useSeller } from "../../../../hooks/api/sellers"
import { OfferStoreSidebar } from "./offer-store-sidebar"

export const OfferDetailStoreSection = ({
  sellerId,
}: {
  sellerId?: string
}) => {
  const canViewSellers = useCan("sellers")
  const { seller } = useSeller(sellerId ?? "", undefined, {
    enabled: !!sellerId && canViewSellers,
  })

  if (!sellerId) {
    return null
  }

  return <OfferStoreSidebar seller={seller} />
}
