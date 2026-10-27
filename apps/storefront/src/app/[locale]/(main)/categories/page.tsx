import { Breadcrumbs } from '@/components/atoms/Breadcrumbs/Breadcrumbs';
import { SearchProductsListing } from '@/components/sections/ProductListing/SearchProductsListing';
import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/helpers/base-url"
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
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = getBaseUrl()

  let locales: string[] = []
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = [locale]
  }

  const { canonical, languages } = buildHreflangAlternates({
    baseUrl,
    path: "/categories",
    locale,
    locales,
  })

  const title = "All Products"
  const description = `Browse all products on ${
    process.env.NEXT_PUBLIC_SITE_NAME || "our store"
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

export default async function AllCategories({
  params,
  searchParams,
}: PageProps<"/[locale]/categories">) {
  const { locale } = await params

  const breadcrumbsItems = [
    {
      path: "/",
      label: "All Products",
    },
  ]

  const baseUrl = getBaseUrl()
  const { products: jsonLdProducts } = await searchProducts({
    countryCode: locale,
    limit: PRODUCT_LIMIT,
  })

  const itemList = jsonLdProducts.slice(0, 8).map((p, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `${baseUrl}/${locale}/products/${p.handle}`,
    name: p.title,
  }))

  return (
    <main className="container">
      <script
        id="ld-breadcrumbs-categories"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "All Products",
                item: `${baseUrl}/${locale}/categories`,
              },
            ],
          }),
        }}
      />
      <script
        id="ld-itemlist-categories"
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

      <h1 className="heading-xl uppercase">All Products</h1>

      <SearchProductsListing locale={locale} searchParams={searchParams} />
    </main>
  )
}
