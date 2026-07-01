import NotFound from "@/app/not-found"
import { Breadcrumbs } from "@/components/atoms"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { AlgoliaProductsListing, ProductListing } from "@/components/sections"
import { getCollectionByHandle } from "@/lib/data/collections"
import { getRegion } from "@/lib/data/regions"
import isBot from "@/lib/helpers/isBot"
import { Suspense } from "react"

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

const SingleCollectionsPage = async ({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) => {
  const { handle, locale } = await params

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
        {bot || !ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
          <ProductListing collection_id={collection.id} showSidebar />
        ) : (
          <AlgoliaProductsListing
            collection_id={collection.id}
            locale={locale}
            currency_code={currency_code}
          />
        )}
      </Suspense>
    </main>
  )
}

export default SingleCollectionsPage
