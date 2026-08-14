import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { getCategoryByHandle, collectCategorySubtreeIds } from "@/lib/data/categories"
import { Suspense } from "react"

import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/atoms"
import { SearchProductsListing, ProductListing } from "@/components/sections"
import { notFound } from "next/navigation"
import isBot from "@/lib/helpers/isBot"
import { headers } from "next/headers"
import Script from "next/script"
import { listRegions } from "@/lib/data/regions"
import { listProducts } from "@/lib/data/products"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"
import {
  NOINDEX_ROBOTS,
  buildPublicPageMetadata,
  resolveBaseUrl,
  serializeJsonLd,
  siteName,
  toPlainText,
} from "@/lib/helpers/seo"

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; locale: string }>
}): Promise<Metadata> {
  const { category: categoryHandle, locale } = await params
  const cat = await getCategoryByHandle(categoryHandle)
  if (!cat) {
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
    path: `/categories/${categoryHandle}`,
    locale,
    locales,
  })

  const title = cat.name
  const description =
    toPlainText(cat.description) || `${cat.name} — ${siteName()}`

  return buildPublicPageMetadata({
    title,
    description,
    canonical,
    languages,
  })
}

async function Category({
  params,
}: {
  params: Promise<{
    category: string
    locale: string
  }>
}) {
  const { category: categoryHandle, locale } = await params

  const category = await getCategoryByHandle(categoryHandle)

  if (!category) {
    return notFound()
  }

  // Include the whole category subtree so a parent department page lists every
  // product in its sub-categories, not just products attached to the parent.
  const categoryIds = collectCategorySubtreeIds(category)
  const ua = (await headers()).get("user-agent") || ""
  const bot = isBot(ua)

  const breadcrumbsItems = [
    {
      path: categoryHandle,
      label: category.name,
    },
  ]

  const headersList = await headers()
  const baseUrl = resolveBaseUrl(
    headersList.get("host"),
    headersList.get("x-forwarded-proto")
  )
  const {
    response: { products: jsonLdProducts },
  } = await listProducts({
    countryCode: locale,
    queryParams: { limit: 8, order: "created_at", fields: "id,title,handle" },
    category_id: categoryIds,
  })

  const itemList = jsonLdProducts.slice(0, 8).map((p, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `${baseUrl}/${locale}/products/${p.handle}`,
    name: p.title,
  }))

  return (
    <main className="container">
      <Script
        id="ld-breadcrumbs-category"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: category.name,
                item: `${baseUrl}/${locale}/categories/${categoryHandle}`,
              },
            ],
          }),
        }}
      />
      <Script
        id="ld-itemlist-category"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: itemList,
          }),
        }}
      />
      <div className="hidden md:block mb-2">
        <Breadcrumbs items={breadcrumbsItems} />
      </div>

      <h1 className="heading-xl uppercase">{category.name}</h1>

      <Suspense fallback={<div data-testid="category-page-loading"><ProductListingSkeleton /></div>}>
        {bot ? (
          <ProductListing category_id={categoryIds} showSidebar locale={locale} />
        ) : (
          <SearchProductsListing category_id={categoryIds} locale={locale} />
        )}
      </Suspense>
    </main>
  )
}

export default Category
