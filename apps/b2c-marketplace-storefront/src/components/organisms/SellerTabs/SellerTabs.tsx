import { Suspense } from "react"
import { ProductListingSkeleton } from "../ProductListingSkeleton/ProductListingSkeleton"
import { SearchProductsListing } from "@/components/sections"
import { TabsContent, TabsList } from "@/components/molecules"

export const SellerTabs = ({
  tab,
  seller_handle,
  seller_id,
  locale,
}: {
  tab: string
  seller_handle: string
  seller_id: string
  locale: string
}) => {
  const tabsList = [
    { label: "products", link: `/sellers/${seller_handle}/` },
  ]

  return (
    <div className="mt-8">
      <TabsList list={tabsList} activeTab={tab} />
      <TabsContent value="products" activeTab={tab}>
        <Suspense fallback={<div data-testid="seller-tabs-products-loading"><ProductListingSkeleton /></div>}>
          <SearchProductsListing seller_id={seller_id} locale={locale} />
        </Suspense>
      </TabsContent>
    </div>
  )
}
