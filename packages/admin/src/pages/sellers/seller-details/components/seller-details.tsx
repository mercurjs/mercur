import { useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../../components/common/skeleton"
import { SingleColumnPage } from "../../../../components/layout/pages"
import { useSeller } from "@/hooks/api"
import { SellerGeneralSection } from "./seller-general-section"
import { SellerOrderSection } from "./seller-order-section"
import { SellerProductSection } from "./seller-product-section"

export const SellerDetails = () => {
  const { id } = useParams()

  const { seller, isLoading, isError, error } = useSeller(id!)

  if (isLoading || !seller) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      data={seller}
      hasOutlet
      showJSON
      showMetadata
    >
      <SellerGeneralSection seller={seller} />
      <SellerOrderSection sellerId={seller.id} />
      <SellerProductSection sellerId={seller.id} />
    </SingleColumnPage>
  )
}
