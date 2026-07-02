"use client"

import { HttpTypes, OfferDTO } from "@mercurjs/types"

import { Button } from "@/components/atoms"
import { Modal } from "@/components/molecules"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { useCartContext } from "@/components/providers"
import { getPricesForVariant } from "@/lib/helpers/get-product-price"
import { toast } from "@/lib/helpers/toast"
import { SellerProps } from "@/types/seller"

export const CompareOffersModal = ({
  product,
  offers,
  locale,
  onClose,
}: {
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
  offers: OfferDTO[]
  locale: string
  onClose: () => void
}) => {
  const { addToCart, onAddToCart, isAddingItem } = useCartContext()

  const handleAddOffer = async (offer: OfferDTO) => {
    const price = getPricesForVariant({ calculated_price: offer.calculated_price })
    if (!price) return

    const subtotal = +(price.calculated_price_without_tax_number || 0)
    const total = +(price.calculated_price_number || 0)

    onAddToCart(
      {
        thumbnail: product.thumbnail || "",
        product_title: product.title,
        quantity: 1,
        subtotal,
        total,
        tax_total: total - subtotal,
        variant_id: offer.variant_id,
        product_id: product.id,
        variant: product.variants?.find(({ id }) => id === offer.variant_id),
        metadata: { offer_id: offer.id },
      },
      price.currency_code || "eur"
    )

    onClose()

    try {
      await addToCart({ offerId: offer.id, quantity: 1, countryCode: locale })
      toast.success({
        title: "Added to cart",
        description: `Offer from ${offer.seller?.name ?? "seller"} added to your cart`,
      })
    } catch (error) {
      toast.error({
        title: "Error adding to cart",
        description: "This offer does not have the required inventory",
      })
    }
  }

  return (
    <Modal
      heading="Compare offers"
      onClose={onClose}
      data-testid="compare-offers-modal"
    >
      <div className="flex flex-col divide-y">
        {offers.map((offer) => {
          const price = getPricesForVariant({
            calculated_price: offer.calculated_price,
          })

          return (
            <div
              key={offer.id}
              className="flex items-center justify-between gap-4 px-4 py-4"
              data-testid="compare-offers-row"
            >
              <div className="flex flex-col gap-1">
                <LocalizedClientLink
                  href={`/sellers/${offer.seller?.handle}`}
                  className="label-md text-primary underline"
                  data-testid="compare-offers-seller"
                >
                  {offer.seller?.name ?? "Seller"}
                </LocalizedClientLink>
                <span
                  className={`label-sm ${
                    offer.in_stock ? "text-positive" : "text-secondary"
                  }`}
                >
                  {offer.in_stock ? "In stock" : "Out of stock"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="heading-sm text-primary">
                  {price?.calculated_price ?? "-"}
                </span>
                <Button
                  onClick={() => handleAddOffer(offer)}
                  disabled={!offer.in_stock || !price}
                  loading={isAddingItem}
                  className="uppercase"
                  size="small"
                  data-testid="compare-offers-add-to-cart-button"
                >
                  Add to cart
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
