import { Suspense } from "react"

import {
  ProductDetailsPage,
  ProductDetailsPageSkeleton,
} from "@/components/sections/ProductDetailsPage/ProductDetailsPage"
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

export default function ProductPage({ params }: PageProps<"/[locale]/products/[handle]">) {
  return (
    <main className="container">
      <Suspense fallback={<ProductDetailsPageSkeleton />}>
        <ProductContent params={params} />
      </Suspense>
    </main>
  )
}

async function ProductContent({ params }: Pick<PageProps<"/[locale]/products/[handle]">, "params">) {
  const { handle, locale } = await params
  return <ProductDetailsPage handle={handle} locale={locale} />
}
