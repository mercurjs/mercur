import { Suspense } from "react"
import { ProductListingSkeleton } from "../ProductListingSkeleton/ProductListingSkeleton"
import { AlgoliaProductsListing, ProductListing } from "@/components/sections"
import { TabsContent, TabsList } from "@/components/molecules"
import { SellerReviewTab } from "@/components/cells"
import { getRegion } from "@/lib/data/regions"

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

export const SellerTabs = ({
  tab,
  seller_handle,
  seller_id,
  locale,
  currency_code,
}: {
  tab: string
  seller_handle: string
  seller_id: string
  locale: string
  currency_code: string
}) => {
  const tabsList = [
    { label: "products", link: `/sellers/${seller_handle}/` },
    {
      label: "reviews",
      link: `/sellers/${seller_handle}/reviews`,
    },
  ]

  return (
    <div className="mt-8">
      <TabsList list={tabsList} activeTab={tab} />
      <TabsContent value="products" activeTab={tab}>
        <Suspense fallback={<div data-testid="seller-tabs-products-loading"><ProductListingSkeleton /></div>}>
          {!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
            <ProductListing showSidebar seller_id={seller_id} />
          ) : (
            <AlgoliaProductsListing
              locale={locale}
              seller_handle={seller_handle}
              currency_code={currency_code}
            />
          )}
        </Suspense>
      </TabsContent>
      <TabsContent value="reviews" activeTab={tab}>
        <Suspense fallback={<div data-testid="seller-tabs-reviews-loading">Loading...</div>}>
          <SellerReviewTab seller_handle={seller_handle} />
        </Suspense>
      </TabsContent>
    </div>
  )
}
