import { Suspense } from "react"

import { ProductDetailsPage } from "@/components/sections"
import { ProductDetailsPageSkeleton } from "@/components/sections/ProductDetailsPage/ProductDetailsPage"
import { listProducts } from "@/lib/data/products"
import { generateProductMetadata } from "@/lib/helpers/seo"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params

  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  }).then(({ response }) => response.products[0])

  return generateProductMetadata(prod, locale)
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) {
  const { handle, locale } = await params

  return (
    <main className="container">
      <Suspense key={handle} fallback={<ProductDetailsPageSkeleton />}>
        <ProductDetailsPage handle={handle} locale={locale} />
      </Suspense>
    </main>
  )
}
