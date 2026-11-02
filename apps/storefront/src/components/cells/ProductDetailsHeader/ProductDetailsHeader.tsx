"use client"

import { useState } from "react"
import { Button } from '@/components/atoms/Button/Button';
import { HttpTypes } from "@medusajs/types"
import { ProductVariants } from '@/components/molecules/ProductVariants/ProductVariants';
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { convertToLocale } from "@/lib/helpers/money"
import {
  getBuyboxWinner,
  getOfferAmount,
  getOfferStock,
  getVariantOffers,
  StoreOffer,
} from "@/lib/helpers/buybox"
import { Chat } from "@/components/organisms/Chat/Chat"
import { CompareOffersModal } from "@/components/organisms/CompareOffersModal/CompareOffersModal"
import { SellerDTO } from "@mercurjs/types"
import { toast } from "@/lib/helpers/toast"
import { useCartContext } from "@/components/providers"
import { useCartDrawer } from "@/components/providers/Cart/drawer"
import { MinusThinIcon, PlusIcon } from "@/icons"

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce(
    (
      acc: Record<string, string>,
      varopt: HttpTypes.StoreProductOptionValue
    ) => {
      acc[varopt.option?.title.toLowerCase() || ""] = varopt.value

      return acc
    },
    {}
  )
}

export const ProductDetailsHeader = ({
  product,
  locale,
  user,
  offers = [],
  seller,
}: {
  product: HttpTypes.StoreProduct
  locale: string
  user: HttpTypes.StoreCustomer | null
  offers?: StoreOffer[]
  seller?: SellerDTO
}) => {
  const { addToCart, cart, isAddingItem } = useCartContext()
  const { allSearchParams } = useGetAllSearchParams()
  const { openDrawer } = useCartDrawer()
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const { cheapestVariant, cheapestPrice } = getProductPrice({
    product,
  })

  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  const selectedVariant = hasAnyPrice
    ? {
        ...optionsAsKeymap(cheapestVariant.options ?? null),
        ...allSearchParams,
      }
    : allSearchParams

  const variantId =
    product.variants?.find(({ options }: { options: any }) =>
      options?.every((option: any) =>
        selectedVariant[option.option?.title.toLowerCase() || ""]?.includes(
          option.value
        )
      )
    )?.id || ""

  const { variantPrice } = getProductPrice({
    product,
    variantId,
  })

  // Buybox: the winning offer for the selected variant sets the price shown and
  // the offer that add-to-cart uses. Products are sold through offers, not the
  // variant's base price.
  const variantOffers = getVariantOffers(offers, variantId)
  const winnerOffer = getBuyboxWinner(variantOffers)
  const otherOffersCount = Math.max(variantOffers.length - 1, 0)

  const offerAmount = winnerOffer ? getOfferAmount(winnerOffer) : null
  const offerCurrency =
    winnerOffer?.calculated_price?.currency_code ||
    variantPrice?.currency_code ||
    "eur"
  const offerStock = winnerOffer ? getOfferStock(winnerOffer) : 0
  const hasOffer = !!winnerOffer && offerAmount !== null

  const displayPrice = hasOffer
    ? convertToLocale({ amount: offerAmount as number, currency_code: offerCurrency })
    : variantPrice?.calculated_price

  const quantityInCart =
    cart?.items?.find((item) => item.metadata?.offer_id === winnerOffer?.id)
      ?.quantity ?? 0
  const isStockMaxLimitReached = quantityInCart >= offerStock

  const isAddToCartDisabled =
    !hasOffer || !offerStock || isStockMaxLimitReached

  const maxQuantity = Math.max(1, Math.min(99, offerStock - quantityInCart))
  const selectedQuantity = Math.min(quantity, maxQuantity)

  const handleAddToCart = async () => {
    if (!winnerOffer || isAddToCartDisabled) return

    const total = offerAmount as number
    const subtotal =
      winnerOffer.calculated_price?.calculated_amount_without_tax ?? total

    const storeCartLineItem = {
      thumbnail: product.thumbnail || "",
      product_title: product.title,
      quantity: selectedQuantity,
      subtotal: subtotal * selectedQuantity,
      total: total * selectedQuantity,
      tax_total: (total - subtotal) * selectedQuantity,
      variant_id: variantId,
      product_id: product.id,
      variant: product.variants?.find(({ id }) => id === variantId),
      metadata: { offer_id: winnerOffer.id },
    }

    openDrawer()
    setQuantity(1)

    try {
      await addToCart({
        offerId: winnerOffer.id,
        quantity: selectedQuantity,
        countryCode: locale,
        optimisticItem: { item: storeCartLineItem, currencyCode: offerCurrency },
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
          <h1 className="heading-lg text-primary" data-testid="product-title">{product.title}</h1>
          <div className="mt-2 flex flex-col gap-1" data-testid="product-price-container">
            {hasOffer ? (
              <span className="heading-md text-primary" data-testid="product-price-current">
                {displayPrice}
              </span>
            ) : hasAnyPrice && variantPrice ? (
              <span className="heading-md text-primary" data-testid="product-price-current">
                {variantPrice.calculated_price}
              </span>
            ) : (
              <span className="label-md text-secondary pt-2 pb-4" data-testid="product-price-unavailable">
                Not available in your region
              </span>
            )}
          </div>
        </div>
      </div>
      {hasAnyPrice && (
        <ProductVariants product={product} selectedVariant={selectedVariant} />
      )}
      <div className="mb-4 flex gap-2">
        <div
          aria-label="Item quantity"
          role="group"
          className="flex shrink-0 items-center rounded-sm border"
          data-testid="product-quantity-picker"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            className="flex h-full w-10 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isAddToCartDisabled || selectedQuantity <= 1}
            onClick={() => setQuantity(Math.max(1, selectedQuantity - 1))}
            data-testid="product-quantity-decrease"
          >
            <MinusThinIcon size={16} />
          </button>
          <span
            aria-live="polite"
            role="status"
            className="label-md w-8 text-center tabular-nums"
            data-testid="product-quantity-value"
          >
            {selectedQuantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="flex h-full w-10 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isAddToCartDisabled || selectedQuantity >= maxQuantity}
            onClick={() => setQuantity(Math.min(maxQuantity, selectedQuantity + 1))}
            data-testid="product-quantity-increase"
          >
            <PlusIcon size={16} />
          </button>
        </div>
      <Button
        onClick={handleAddToCart}
        disabled={isAddToCartDisabled}
        loading={isAddingItem}
        className="w-full uppercase py-3 flex justify-center"
        size="large"
        data-testid="product-add-to-cart-button"
      >
        {!hasOffer
          ? "NOT AVAILABLE"
          : offerStock
          ? "ADD TO CART"
          : "OUT OF STOCK"}
      </Button>
      </div>
      {otherOffersCount > 0 && (
        <Button
          variant="tonal"
          onClick={() => setIsCompareOpen(true)}
          className="w-full uppercase mb-4"
          data-testid="compare-offers-button"
        >
          {`Compare other ${otherOffersCount} offers`}
        </Button>
      )}
      {isCompareOpen && (
        <CompareOffersModal
          offers={variantOffers}
          locale={locale}
          variantLabel={
            product.variants?.find(({ id }) => id === variantId)?.title ||
            undefined
          }
          onClose={() => setIsCompareOpen(false)}
        />
      )}
      {user && seller && (
        <Chat
          user={user}
          seller={seller}
          buttonClassNames="w-full uppercase"
          product={product}
        />
      )}
    </div>
  )
}
