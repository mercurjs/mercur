import { useSeller } from "../../../../hooks/api/sellers"
import { OfferStoreSidebar } from "./offer-store-sidebar"

export const OfferDetailStoreSection = ({
  sellerId,
}: {
  sellerId?: string
}) => {
  const { seller } = useSeller(sellerId ?? "", undefined, {
    enabled: !!sellerId,
  })

  if (!sellerId) {
    return null
  }

  return <OfferStoreSidebar seller={seller} />
}
