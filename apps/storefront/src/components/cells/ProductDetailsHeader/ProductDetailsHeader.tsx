"use client"

import { useState } from "react"

import { Button } from "@/components/atoms"
import { HttpTypes, OfferDTO } from "@mercurjs/types"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { CompareOffersModal } from "@/components/organisms/CompareOffersModal/CompareOffersModal"
import { getPricesForVariant } from "@/lib/helpers/get-product-price"
import { Chat } from "@/components/organisms/Chat/Chat"
import { SellerProps } from "@/types/seller"
import { WishlistButton } from "../WishlistButton/WishlistButton"
import { Wishlist } from "@/types/wishlist"
import { toast } from "@/lib/helpers/toast"
import { useCartContext } from "@/components/providers"

export const ProductDetailsHeader = ({
  product,
  offers,
  locale,
  user,
  wishlist,
}: {
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
  offers: OfferDTO[]
  locale: string
  user: HttpTypes.StoreCustomer | null
  wishlist?: Wishlist
}) => {
  const { addToCart, onAddToCart, cart, isAddingItem } = useCartContext()
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  const cheapestOffer = offers[0] ?? null
  const offerPrice = cheapestOffer
    ? getPricesForVariant({ calculated_price: cheapestOffer.calculated_price })
    : null

  const hasOffer = !!cheapestOffer && !!offerPrice
  const inStock = !!cheapestOffer?.in_stock

  const quantityInCart =
    cart?.items?.find(
      (item) =>
        (item.metadata as { offer_id?: string } | null)?.offer_id ===
        cheapestOffer?.id
    )?.quantity ?? 0

  const isStockLimitReached =
    quantityInCart >= (cheapestOffer?.inventory_quantity ?? 0)

  const isAddToCartDisabled = !hasOffer || !inStock || isStockLimitReached

  const handleAddToCart = async () => {
    if (!cheapestOffer || !offerPrice || isStockLimitReached) return

    const subtotal = +(offerPrice.calculated_price_without_tax_number || 0)
    const total = +(offerPrice.calculated_price_number || 0)

    onAddToCart(
      {
        thumbnail: product.thumbnail || "",
        product_title: product.title,
        quantity: 1,
        subtotal,
        total,
        tax_total: total - subtotal,
        variant_id: cheapestOffer.variant_id,
        product_id: product.id,
        variant: product.variants?.find(
          ({ id }) => id === cheapestOffer.variant_id
        ),
        metadata: { offer_id: cheapestOffer.id },
      },
      offerPrice.currency_code || "eur"
    )

    try {
      await addToCart({
        offerId: cheapestOffer.id,
        quantity: 1,
        countryCode: locale,
      })
    } catch (error) {
      toast.error({
        title: "Error adding to cart",
        description: "This offer does not have the required inventory",
      })
    }
  }

  return (
    <div className="border rounded-sm p-5" data-testid="product-details-header">
      <div className="flex justify-between">
        <div>
          <h1 className="heading-lg text-primary" data-testid="product-title">
            {product.title}
          </h1>
          <div
            className="mt-2 flex gap-2 items-center"
            data-testid="product-price-container"
          >
            {hasOffer && offerPrice ? (
              <>
                <span
                  className="heading-md text-primary"
                  data-testid="product-price-current"
                >
                  {offerPrice.calculated_price}
                </span>
                {offerPrice.calculated_price_number !==
                  offerPrice.original_price_number && (
                  <span
                    className="label-md text-secondary line-through"
                    data-testid="product-price-original"
                  >
                    {offerPrice.original_price}
                  </span>
                )}
              </>
            ) : (
              <span
                className="label-md text-secondary pt-2 pb-4"
                data-testid="product-price-unavailable"
              >
                Not available in your region
              </span>
            )}
          </div>
          {cheapestOffer?.seller && (
            <p
              className="label-md text-secondary mt-2"
              data-testid="product-offer-seller"
            >
              Sold by{" "}
              <LocalizedClientLink
                href={`/sellers/${cheapestOffer.seller.handle}`}
                className="text-primary underline"
              >
                {cheapestOffer.seller.name}
              </LocalizedClientLink>
            </p>
          )}
        </div>
        <div>
          <WishlistButton
            productId={product.id}
            wishlist={wishlist}
            user={user}
          />
        </div>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={isAddToCartDisabled}
        loading={isAddingItem}
        className="w-full uppercase mt-4 mb-2 py-3 flex justify-center"
        size="large"
        data-testid="product-add-to-cart-button"
      >
        {!hasOffer
          ? "NOT AVAILABLE IN YOUR REGION"
          : inStock
          ? "ADD TO CART"
          : "OUT OF STOCK"}
      </Button>

      {offers.length > 1 && (
        <Button
          onClick={() => setIsCompareOpen(true)}
          variant="tonal"
          className="w-full uppercase mb-4 py-3 flex justify-center"
          size="large"
          data-testid="product-compare-offers-button"
        >
          {`Compare other offers (${offers.length - 1})`}
        </Button>
      )}

      {user && product.seller && (
        <Chat
          user={user}
          seller={product.seller}
          buttonClassNames="w-full uppercase"
          product={product}
        />
      )}

      {isCompareOpen && (
        <CompareOffersModal
          product={product}
          offers={offers}
          locale={locale}
          onClose={() => setIsCompareOpen(false)}
        />
      )}
    </div>
  )
}
