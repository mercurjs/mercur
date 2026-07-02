import { Suspense } from "react"
import { ProductListingSkeleton } from "../ProductListingSkeleton/ProductListingSkeleton"
import { SearchProductsListing } from "@/components/sections"
import { TabsContent, TabsList } from "@/components/molecules"
import { SellerReviewTab } from "@/components/cells"
import { listProductAttributes } from "@/lib/data/product-attributes"

export const SellerTabs = async ({
  tab,
  seller_handle,
  locale,
  currency_code,
  searchParams,
}: {
  tab: string
  seller_handle: string
  seller_id: string
  locale: string
  currency_code: string
  searchParams?: Record<string, string | string[] | undefined>
}) => {
  const attributes = await listProductAttributes()

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
          <SearchProductsListing
            locale={locale}
            seller_handle={seller_handle}
            attributes={attributes}
            searchParams={searchParams}
            currency_code={currency_code}
          />
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
