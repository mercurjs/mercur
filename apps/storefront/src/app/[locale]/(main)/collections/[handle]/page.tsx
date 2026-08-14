import NotFound from "@/app/not-found"
import { Breadcrumbs } from "@/components/atoms"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { SearchProductsListing, ProductListing } from "@/components/sections"
import { getCollectionByHandle } from "@/lib/data/collections"
import { listRegions } from "@/lib/data/regions"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"
import {
  NOINDEX_ROBOTS,
  buildPublicPageMetadata,
  resolveBaseUrl,
  siteName,
} from "@/lib/helpers/seo"
import isBot from "@/lib/helpers/isBot"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { Suspense } from "react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params

  const collection = await getCollectionByHandle(handle)
  if (!collection) {
    return { robots: NOINDEX_ROBOTS }
  }

  const headersList = await headers()
  const baseUrl = resolveBaseUrl(
    headersList.get("host"),
    headersList.get("x-forwarded-proto")
  )

  let locales: string[] = []
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = [locale]
  }

  const { canonical, languages } = buildHreflangAlternates({
    baseUrl,
    path: `/collections/${handle}`,
    locale,
    locales,
  })

  const title = collection.title
  const description = `${collection.title} — ${siteName()}`

  return buildPublicPageMetadata({
    title,
    description,
    canonical,
    languages,
  })
}

const SingleCollectionsPage = async ({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) => {
  const { handle, locale } = await params

  const bot = isBot(navigator.userAgent)
  const collection = await getCollectionByHandle(handle)

  if (!collection) return <NotFound />

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
          <SearchProductsListing collection_id={collection.id} locale={locale} />
        )}
      </Suspense>
    </main>
  )
}

export default SingleCollectionsPage
