import { SellerTabs } from "@/components/organisms"
import { SellerPageHeader } from "@/components/sections"
import { retrieveCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import { getSellerByHandle } from "@/lib/data/seller"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"
import {
  NOINDEX_ROBOTS,
  buildPublicPageMetadata,
  buildSellerJsonLd,
  resolveBaseUrl,
  serializeJsonLd,
  siteName,
  toPlainText,
} from "@/lib/helpers/seo"
import { SellerDTO } from "@mercurjs/types"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params

  const seller = (await getSellerByHandle(handle)) as SellerDTO
  if (!seller) {
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
    path: `/sellers/${handle}`,
    locale,
    locales,
  })

  const title = seller.name
  const description =
    toPlainText(seller.description) || `${seller.name} — ${siteName()}`

  return buildPublicPageMetadata({
    title,
    description,
    canonical,
    languages,
    image: seller.logo || seller.banner || undefined,
    imageAlt: seller.name,
  })
}

export default async function SellerPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string; locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { handle, locale } = await params
  const { page } = await searchParams

  const seller = (await getSellerByHandle(handle)) as SellerDTO

  const user = await retrieveCustomer()

  const tab = "offers"

  if (!seller) {
    return null
  }

  const headersList = await headers()
  const baseUrl = resolveBaseUrl(
    headersList.get("host"),
    headersList.get("x-forwarded-proto")
  )
  const { canonical } = buildHreflangAlternates({
    baseUrl,
    path: `/sellers/${handle}`,
    locale,
    locales: [locale],
  })

  return (
    <main className="container">
      <Script
        id="ld-seller"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildSellerJsonLd({
              name: seller.name,
              canonical,
              description: seller.description,
              logo: seller.logo,
            })
          ),
        }}
      />
      <SellerPageHeader header seller={seller} user={user} />
      <SellerTabs
        tab={tab}
        seller_id={seller.id}
        seller_handle={seller.handle}
        locale={locale}
        page={page ? parseInt(page, 10) : 1}
      />
    </main>
  )
}
