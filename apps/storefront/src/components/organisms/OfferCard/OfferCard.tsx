"use client"

import Image from "next/image"

import { Button } from "@/components/atoms"
import { toast } from "@/lib/helpers/toast"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { useCartContext } from "@/components/providers"
import { getOfferAmount, getOfferStock, type StoreOffer } from "@/lib/helpers/buybox"
import { convertToLocale } from "@/lib/helpers/money"
import { cn } from "@/lib/utils"

export const OfferCard = ({
  offer,
  locale,
  className,
}: {
  offer: StoreOffer
  locale: string
  className?: string
}) => {
  const { addToCart, onAddToCart, cart, isAddingItem } = useCartContext()

  const product = offer.product
  const productName = String(product?.title || "Product")

  const amount = getOfferAmount(offer)
  const currency = offer.calculated_price?.currency_code || cart?.currency_code || "eur"
  const stock = getOfferStock(offer)

  const hasPrice = amount !== null
  const displayPrice = hasPrice
    ? convertToLocale({ amount: amount as number, currency_code: currency })
    : null

  const quantityInCart =
    cart?.items?.find((item) => item.metadata?.offer_id === offer.id)?.quantity ?? 0
  const isStockMaxLimitReached = quantityInCart >= stock
  const isAddToCartDisabled = !hasPrice || !stock || isStockMaxLimitReached

  const handleAddToCart = async () => {
    if (isAddToCartDisabled) return

    const total = amount as number
    const subtotal =
      offer.calculated_price?.calculated_amount_without_tax ?? total

    onAddToCart(
      {
        thumbnail: product?.thumbnail || "",
        product_title: product?.title,
        quantity: 1,
        subtotal,
        total,
        tax_total: total - subtotal,
        variant_id: offer.variant_id,
        product_id: offer.product_id,
        metadata: { offer_id: offer.id },
      },
      currency
    )

    try {
      await addToCart({ offerId: offer.id, quantity: 1, countryCode: locale })
    } catch (error) {
      toast.error({
        title: "Error adding to cart",
        description: "This offer does not have the required inventory",
      })
    }
  }

  return (
    <div
      className={cn(
        "relative group border rounded-sm flex flex-col justify-between p-1 w-full lg:w-[calc(25%-1rem)] min-w-[250px]",
        className
      )}
      data-testid="offer-card"
      data-offer-id={offer.id}
    >
      <div className="relative w-full h-full bg-primary aspect-square" data-testid="offer-card-image-container">
        <LocalizedClientLink
          href={`/products/${product?.handle}`}
          aria-label={`View ${productName}`}
          title={`View ${productName}`}
          data-testid="offer-card-link"
        >
          <div className="overflow-hidden rounded-sm w-full h-full flex justify-center align-center">
            <Image
              priority
              fetchPriority="high"
              src={product?.thumbnail ? decodeURIComponent(product.thumbnail) : "/images/placeholder.svg"}
              alt={`${productName} image`}
              width={100}
              height={100}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain aspect-square w-full object-center h-full rounded-xs"
              data-testid="offer-card-image"
            />
          </div>
        </LocalizedClientLink>
      </div>
      <div className="flex flex-col gap-3 p-4" data-testid="offer-card-info">
        <LocalizedClientLink
          href={`/products/${product?.handle}`}
          aria-label={`Go to ${productName} page`}
          title={`Go to ${productName} page`}
        >
          <h3 className="heading-sm truncate" data-testid="offer-card-title">
            {productName}
          </h3>
          <div className="flex items-center gap-2 mt-2" data-testid="offer-card-price">
            {displayPrice ? (
              <p className="font-medium" data-testid="offer-card-current-price">
                {displayPrice}
              </p>
            ) : (
              <p className="label-md text-secondary" data-testid="offer-card-price-unavailable">
                Not available in your region
              </p>
            )}
          </div>
        </LocalizedClientLink>
        <Button
          onClick={handleAddToCart}
          disabled={isAddToCartDisabled}
          loading={isAddingItem}
          className="w-full uppercase py-3 flex justify-center"
          data-testid="offer-card-add-to-cart-button"
        >
          {!hasPrice ? "NOT AVAILABLE" : stock ? "ADD TO CART" : "OUT OF STOCK"}
        </Button>
      </div>
    </div>
  )
}
