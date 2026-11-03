"use client"

import Image from "next/image"
import { Button } from '@/components/atoms/Button/Button';
import { HttpTypes } from "@medusajs/types"
import { cn } from "@/lib/utils"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { convertToLocale } from "@/lib/helpers/money"
import type { ListingProduct } from "@/lib/data/search"
import { Product } from "@/types/product"

type CardProduct = HttpTypes.StoreProduct | Product | ListingProduct

const isListingProduct = (product: CardProduct): product is ListingProduct =>
  "min_price" in product && "currency_code" in product

const getCardPrice = (product: CardProduct) => {
  if (isListingProduct(product)) {
    return {
      calculated_price: convertToLocale({
        amount: product.min_price,
        currency_code: product.currency_code,
      }),
      original_price: null,
    }
  }
  const { cheapestPrice } = getProductPrice({ product: product as HttpTypes.StoreProduct })
  return cheapestPrice
}

export const ProductCard = ({
  product,
  className,
  eager = false,
}: {
  product: CardProduct,
  className?: string
  eager?: boolean
}) => {
  if (!product) {
    return null
  }

  const price = getCardPrice(product)
  const productName = String(product.title || "Product")
  const imageProps = eager
    ? { priority: true, fetchPriority: "high" as const }
    : { loading: "lazy" as const }

  return (
    <div
      className={cn(
        "relative group border rounded-sm flex flex-col justify-between p-1 w-full lg:w-[calc(25%-1rem)] min-w-[250px]",
        className
      )}
      data-testid="product-card"
      data-product-handle={product.handle}
    >
      <div className="relative w-full h-full bg-primary aspect-square" data-testid="product-card-image-container">
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          aria-label={`View ${productName}`}
          title={`View ${productName}`}
          data-testid="product-card-link"
        >
          <div className="overflow-hidden rounded-sm w-full h-full flex justify-center align-center ">
            {product.thumbnail ? (
              <Image
                {...imageProps}
                src={decodeURIComponent(product.thumbnail)}
                alt={`${productName} image`}
                width={100}
                height={100}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-contain aspect-square w-full object-center h-full lg:group-hover:-mt-14 transition-all duration-300 rounded-xs"
                data-testid="product-card-image"
              />
            ) : (
              <Image
                {...imageProps}
                src="/images/placeholder.svg"
                alt={`${productName} image placeholder`}
                width={100}
                height={100}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                data-testid="product-card-placeholder-image"
              />
            )}
          </div>
        </LocalizedClientLink>
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          aria-label={`See more about ${productName}`}
          title={`See more about ${productName}`}
        >
          <Button className="absolute rounded-sm bg-action text-action-on-primary h-auto lg:h-[48px] lg:group-hover:block hidden w-full uppercase bottom-1 z-10" data-testid="product-card-see-more-button">
            See More
          </Button>
        </LocalizedClientLink>
      </div>
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        aria-label={`Go to ${productName} page`}
        title={`Go to ${productName} page`}
      >
        <div className="flex justify-between p-4" data-testid="product-card-info">
          <div className="w-full">
            <h3 className="heading-sm truncate" data-testid="product-card-title">{product.title}</h3>
            <div className="flex items-center gap-2 mt-2" data-testid="product-card-price">
              <p className="font-medium" data-testid="product-card-current-price">{price?.calculated_price}</p>
              {price?.original_price && price.calculated_price !== price.original_price && (
                <p className="text-sm text-gray-500 line-through" data-testid="product-card-original-price">
                  {price.original_price}
                </p>
              )}
            </div>
          </div>
        </div>
      </LocalizedClientLink>
    </div>
  )
}
