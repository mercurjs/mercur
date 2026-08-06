import { SellerTabs } from "@/components/organisms"
import { SellerPageHeader } from "@/components/sections"
import { retrieveCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import { getSellerByHandle } from "@/lib/data/seller"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"
import { SellerDTO } from "@mercurjs/types"
import type { Metadata } from "next"
import { headers } from "next/headers"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params

  const seller = (await getSellerByHandle(handle)) as SellerDTO
  if (!seller) {
    return {}
  }

  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`

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
  const description = `${seller.name} - ${
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

  return (
    <main className="container">
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
