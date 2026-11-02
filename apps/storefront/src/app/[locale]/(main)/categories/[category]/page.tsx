import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { getCategoryByHandle, collectCategorySubtreeIds } from "@/lib/data/categories"
import { Suspense } from "react"

import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/helpers/base-url"
import { Breadcrumbs } from '@/components/atoms/Breadcrumbs/Breadcrumbs';
import { SearchProductsListing } from '@/components/sections/ProductListing/SearchProductsListing';
import { notFound } from "next/navigation"
import { listRegions } from "@/lib/data/regions"
import { searchProducts } from "@/lib/data/products"
import { PRODUCT_LIMIT } from "@/const"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"


export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; locale: string }>
}): Promise<Metadata> {
  const { category: categoryHandle, locale } = await params
  const baseUrl = getBaseUrl()

  const cat = await getCategoryByHandle(categoryHandle)
  if (!cat) {
    return {}
  }

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

  const title = `${cat.name} Category`
  const description = `${cat.name} Category - ${
    process.env.NEXT_PUBLIC_SITE_NAME || "Storefront"
  }`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME || "Storefront"}`,
      description,
      url: canonical,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Storefront",
      type: "website",
    },
  }
}

export default function CategoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/categories/[category]">) {
  return (
    <main className="container">
      <Suspense
        fallback={
          <div aria-busy="true" data-testid="category-page-loading">
            <ProductListingSkeleton />
          </div>
        }
      >
        <Category params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function Category({
  params,
  searchParams,
}: Pick<PageProps<"/[locale]/categories/[category]">, "params" | "searchParams">) {
  const { category: categoryHandle, locale } = await params

  const category = await getCategoryByHandle(categoryHandle)

  if (!category) {
    return notFound()
  }

  // Include the whole category subtree so a parent department page lists every
  // product in its sub-categories, not just products attached to the parent.
  const categoryIds = collectCategorySubtreeIds(category)

  const breadcrumbsItems = [
    {
      path: categoryHandle,
      label: category.name,
    },
  ]

  const baseUrl = getBaseUrl()
  const { products: jsonLdProducts } = await searchProducts({
    countryCode: locale,
    category_id: categoryIds,
    limit: PRODUCT_LIMIT,
  })

  const itemList = jsonLdProducts.slice(0, 8).map((p, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `${baseUrl}/${locale}/products/${p.handle}`,
    name: p.title,
  }))

  return (
    <>
      <script
        id="ld-breadcrumbs-category"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
      <script
        id="ld-itemlist-category"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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

      <SearchProductsListing
        category_id={categoryIds}
        locale={locale}
        searchParams={searchParams}
      />
    </>
  )
}
