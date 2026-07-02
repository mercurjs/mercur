import NotFound from "@/app/not-found"
import { Breadcrumbs } from "@/components/atoms"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { SearchProductsListing, ProductListing } from "@/components/sections"
import { getCollectionByHandle } from "@/lib/data/collections"
import { listProductAttributes } from "@/lib/data/product-attributes"
import { getRegion } from "@/lib/data/regions"
import isBot from "@/lib/helpers/isBot"
import { Suspense } from "react"

const SingleCollectionsPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string; locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) => {
  const { handle, locale } = await params
  const resolvedSearchParams = await searchParams

  const bot = isBot(navigator.userAgent)
  const collection = await getCollectionByHandle(handle)

  if (!collection) return <NotFound />

  const currency_code = (await getRegion(locale))?.currency_code || "usd"

  const breadcrumbsItems = [
    {
      path: collection.handle,
      label: collection.title,
    },
  ]

  return (
    <main className="container">
      <div className="hidden md:block mb-2">
        <Breadcrumbs items={breadcrumbsItems} />
      </div>

      <h1 className="heading-xl uppercase">{collection.title}</h1>

      <Suspense fallback={<div data-testid="collection-page-loading"><ProductListingSkeleton /></div>}>
        {bot ? (
          <ProductListing collection_id={collection.id} showSidebar />
        ) : (
          <SearchProductsListing
            collection_id={collection.id}
            attributes={await listProductAttributes()}
            searchParams={resolvedSearchParams}
            locale={locale}
            currency_code={currency_code}
          />
        )}
      </Suspense>
    </main>
  )
}

export default SingleCollectionsPage
