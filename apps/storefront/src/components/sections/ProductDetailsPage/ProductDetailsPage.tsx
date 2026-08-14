import { ProductDetails, ProductGallery } from "@/components/organisms"
import { listProducts } from "@/lib/data/products"
import { listOffers } from "@/lib/data/offers"
import { StoreOffer } from "@/lib/helpers/buybox"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"
import {
  buildProductJsonLd,
  resolveBaseUrl,
  serializeJsonLd,
} from "@/lib/helpers/seo"
import { listRegions } from "@/lib/data/regions"
import { HomeProductSection } from "../HomeProductSection/HomeProductSection"
import NotFound from "@/app/not-found"
import { headers } from "next/headers"
import Script from "next/script"

export const ProductDetailsPage = async ({
  handle,
  locale,
}: {
  handle: string
  locale: string
}) => {
  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  }).then(({ response }) => response.products[0])

  if (!prod) return null

  if (prod.seller?.store_status === "SUSPENDED") {
    return NotFound()
  }

  const { offers } = await listOffers({
    productId: prod.id,
    countryCode: locale,
  })

  const headersList = await headers()
  const baseUrl = resolveBaseUrl(
    headersList.get("host"),
    headersList.get("x-forwarded-proto")
  )
  let locales: string[] = [locale]
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = [locale]
  }
  const { canonical } = buildHreflangAlternates({
    baseUrl,
    path: `/products/${handle}`,
    locale,
    locales,
  })

  return (
    <>
      <Script
        id="ld-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildProductJsonLd({
              product: prod,
              canonical,
              offers: offers as StoreOffer[],
            })
          ),
        }}
      />
      <div className="flex flex-col md:flex-row lg:gap-12" data-testid="product-details-page">
        <div className="md:w-1/2 md:px-2" data-testid="product-gallery-container">
          <ProductGallery images={prod?.images || []} />
        </div>
        <div className="md:w-1/2 md:px-2" data-testid="product-details-container">
          <ProductDetails
            product={prod}
            locale={locale}
            offers={offers as StoreOffer[]}
          />
        </div>
      </div>
      <div className="my-8">
        <HomeProductSection
          heading="Similar items"
          products={prod.seller?.products}
          locale={locale}
        />
      </div>
    </>
  )
}
