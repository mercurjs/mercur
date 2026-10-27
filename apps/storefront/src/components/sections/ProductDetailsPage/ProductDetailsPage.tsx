import { ProductDetails, ProductGallery } from "@/components/organisms"
import { listProducts } from "@/lib/data/products"
import { listOffers } from "@/lib/data/offers"
import { retrieveCustomer } from "@/lib/data/customer"
import { StoreOffer } from "@/lib/helpers/buybox"
import { HomeProductSection } from "../HomeProductSection/HomeProductSection"
import NotFound from "@/app/not-found"

export const ProductDetailsPage = async ({
  handle,
  locale,
}: {
  handle: string
  locale: string
}) => {
  const userPromise = retrieveCustomer()

  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  }).then(({ response }) => response.products[0])

  if (!prod) return null

  if (prod.seller?.store_status === "SUSPENDED") {
    return NotFound()
  }

  const [{ offers }, user] = await Promise.all([
    listOffers({ productId: prod.id, countryCode: locale }),
    userPromise,
  ])

  return (
    <>
      <div className="flex flex-col md:flex-row lg:gap-12" data-testid="product-details-page">
        <div className="md:w-1/2 md:px-2" data-testid="product-gallery-container">
          <ProductGallery images={prod?.images || []} />
        </div>
        <div className="md:w-1/2 md:px-2" data-testid="product-details-container">
          <ProductDetails
            product={prod}
            locale={locale}
            offers={offers as StoreOffer[]}
            user={user}
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

export const ProductDetailsPageSkeleton = () => (
  <div
    aria-busy="true"
    className="flex flex-col md:flex-row lg:gap-12"
    data-testid="product-details-page-skeleton"
  >
    <div className="md:w-1/2 md:px-2">
      <div className="aspect-square w-full animate-pulse rounded-sm bg-component-secondary" />
    </div>
    <div className="md:w-1/2 md:px-2">
      <div className="h-64 w-full animate-pulse rounded-sm border bg-component-secondary" />
    </div>
  </div>
)
