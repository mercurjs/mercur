import { Breadcrumbs } from '@/components/atoms/Breadcrumbs/Breadcrumbs';
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { SearchProductsListing } from '@/components/sections/ProductListing/SearchProductsListing';
import { getCollectionByHandle } from "@/lib/data/collections"
import { listRegions } from "@/lib/data/regions"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"
import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/helpers/base-url"
import { notFound } from "next/navigation"
import { Suspense } from "react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params

  const collection = await getCollectionByHandle(handle)
  if (!collection) {
    return {}
  }

  const baseUrl = getBaseUrl()

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
  const description = `${collection.title} - ${
    process.env.NEXT_PUBLIC_SITE_NAME || "Storefront"
  }`

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME || "Storefront"}`,
      description,
      url: canonical,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Storefront",
      type: "website",
    },
  }
}

export default function SingleCollectionsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/collections/[handle]">) {
  return (
    <main className="container">
      <Suspense
        fallback={
          <div aria-busy="true" data-testid="collection-page-loading">
            <ProductListingSkeleton />
          </div>
        }
      >
        <Collection params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function Collection({
  params,
  searchParams,
}: Pick<PageProps<"/[locale]/collections/[handle]">, "params" | "searchParams">) {
  const { handle, locale } = await params

  const collection = await getCollectionByHandle(handle)

  if (!collection) notFound()

  const breadcrumbsItems = [
    {
      path: collection.handle,
      label: collection.title,
    },
  ]

  return (
    <>
      <div className="hidden md:block mb-2">
        <Breadcrumbs items={breadcrumbsItems} />
      </div>

      <h1 className="heading-xl uppercase">{collection.title}</h1>

      <SearchProductsListing
        collection_id={collection.id}
        locale={locale}
        searchParams={searchParams}
      />
    </>
  )
}
