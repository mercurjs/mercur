import { OfferCard, ProductsPagination } from "@/components/organisms"
import { ProductListingNoResultsView } from "@/components/molecules"
import { PRODUCT_LIMIT } from "@/const"
import { listOffers } from "@/lib/data/offers"
import type { StoreOffer } from "@/lib/helpers/buybox"

export const SellerOffersListing = async ({
  seller_id,
  locale,
  page = 1,
}: {
  seller_id: string
  locale: string
  page?: number
}) => {
  const currentPage = Math.max(page, 1)
  const offset = (currentPage - 1) * PRODUCT_LIMIT

  const { offers, count } = await listOffers({
    sellerId: seller_id,
    countryCode: locale,
    limit: PRODUCT_LIMIT,
    offset,
  })

  const pages = Math.ceil(count / PRODUCT_LIMIT) || 1

  return (
    <div className="py-4" data-testid="seller-offers-listing">
      <div className="my-4 label-md">{`${count} listings`}</div>
      {offers.length === 0 ? (
        <ProductListingNoResultsView />
      ) : (
        <>
          <div className="flex flex-wrap gap-4" data-testid="seller-offers-list">
            {(offers as StoreOffer[]).map((offer) => (
              <OfferCard key={offer.id} offer={offer} locale={locale} />
            ))}
          </div>
          <ProductsPagination pages={pages} />
        </>
      )}
    </div>
  )
}
