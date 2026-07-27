"use client"

import { useState } from "react"

import { Badge, Button } from "@/components/atoms"
import { SellerAvatar } from "@/components/cells/SellerAvatar/SellerAvatar"
import { Modal } from "@/components/molecules/Modal/Modal"
import { useCartContext } from "@/components/providers"
import { convertToLocale } from "@/lib/helpers/money"
import { toast } from "@/lib/helpers/toast"
import {
  getOfferAmount,
  getOfferStock,
  isPurchasable,
  rankOffers,
  StoreOffer,
} from "@/lib/helpers/buybox"

export const CompareOffersModal = ({
  offers,
  locale,
  variantLabel,
  onClose,
}: {
  offers: StoreOffer[]
  locale: string
  variantLabel?: string
  onClose: () => void
}) => {
  const { addToCart } = useCartContext()
  const [addingId, setAddingId] = useState<string | null>(null)

  const ranked = rankOffers(offers)

  const handleAdd = async (offer: StoreOffer) => {
    setAddingId(offer.id)
    try {
      await addToCart({ offerId: offer.id, quantity: 1, countryCode: locale })
      toast.success({ title: "Added to cart" })
    } catch (error) {
      toast.error({
        title: "Error adding to cart",
        description: "This offer does not have the required inventory",
      })
    } finally {
      setAddingId(null)
    }
  }

  return (
    <Modal
      heading={`Compare ${ranked.length} offers`}
      onClose={onClose}
      data-testid="compare-offers-modal"
    >
      <div className="flex flex-col gap-3 p-4">
        {variantLabel && (
          <p className="label-md text-secondary" data-testid="compare-offers-variant">
            {variantLabel}
          </p>
        )}
        {ranked.map((offer, index) => {
          const amount = getOfferAmount(offer)
          const stock = getOfferStock(offer)
          const buyable = isPurchasable(offer)

          return (
            <div
              key={offer.id}
              className="flex items-center justify-between gap-4 border rounded-sm p-4"
              data-testid="compare-offer-row"
              data-offer-id={offer.id}
            >
              <div className="flex items-center gap-3 min-w-0">
                <SellerAvatar
                  photo={offer.seller?.logo || ""}
                  size={40}
                  alt={offer.seller?.name || "Seller"}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="label-lg text-primary truncate">
                      {offer.seller?.name || "Seller"}
                    </p>
                    {index === 0 && buyable && (
                      <Badge className="bg-positive">Best price</Badge>
                    )}
                    {offer.seller?.is_premium && (
                      <Badge className="bg-warning">Premium</Badge>
                    )}
                  </div>
                  <p className="label-sm text-secondary">
                    {buyable ? `${stock} in stock` : "Out of stock"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="heading-sm text-primary" data-testid="compare-offer-price">
                  {amount !== null
                    ? convertToLocale({
                        amount,
                        currency_code:
                          offer.calculated_price?.currency_code || "eur",
                      })
                    : "—"}
                </span>
                <Button
                  size="small"
                  onClick={() => handleAdd(offer)}
                  disabled={!buyable || addingId !== null}
                  loading={addingId === offer.id}
                  data-testid="compare-offer-add-to-cart"
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
