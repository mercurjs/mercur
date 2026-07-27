import { Suspense } from "react"
import { ProductListingSkeleton } from "../ProductListingSkeleton/ProductListingSkeleton"
import { SellerOffersListing } from "@/components/sections"
import { TabsContent, TabsList } from "@/components/molecules"

export const SellerTabs = ({
  tab,
  seller_handle,
  seller_id,
  locale,
  page = 1,
}: {
  tab: string
  seller_handle: string
  seller_id: string
  locale: string
  page?: number
}) => {
  const tabsList = [
    { label: "Offers", link: `/sellers/${seller_handle}/` },
  ]

  return (
    <div className="mt-8">
      <TabsList list={tabsList} activeTab={tab} />
      <TabsContent value="offers" activeTab={tab}>
        <Suspense
          key={page}
          fallback={<div data-testid="seller-tabs-products-loading"><ProductListingSkeleton /></div>}
        >
          <SellerOffersListing seller_id={seller_id} locale={locale} page={page} />
        </Suspense>
      </TabsContent>
    </div>
  )
}
