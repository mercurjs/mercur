import { ProductDetailsPage } from "@/components/sections/ProductDetailsPage/ProductDetailsPage"
import { listProducts } from "@/lib/data/products"
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
  toPlainText,
} from "@/lib/helpers/seo"
import type { Metadata } from "next"
import { headers } from "next/headers"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params

  const product = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  }).then(({ response }) => response.products[0])

  if (!product?.handle) {
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
    path: `/products/${product.handle}`,
    locale,
    locales,
  })

  const title = product.title
  const description =
    toPlainText(product.description) || `${title} — ${siteName()}`
  const image =
    product.thumbnail ||
    product.images?.[0]?.url ||
    `${baseUrl}/images/placeholder.svg`

  return {
    ...buildPublicPageMetadata({
      title,
      description,
      canonical,
      languages,
      image,
      imageAlt: title,
    }),
    metadataBase: new URL(baseUrl),
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) {
  const { handle, locale } = await params

  return (
    <main className="container">
      <ProductDetailsPage handle={handle} locale={locale} />
    </main>
  )
}
