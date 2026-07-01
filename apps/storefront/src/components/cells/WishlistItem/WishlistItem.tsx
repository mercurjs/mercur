import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { WishlistButton } from "../WishlistButton/WishlistButton"
import { Wishlist } from "@/types/wishlist"
import { convertToLocale } from "@/lib/helpers/money"
import { Button } from "@/components/atoms"
import clsx from "clsx"
import { getProductPrice } from "@/lib/helpers/get-product-price"

export const WishlistItem = ({
  product,
  wishlist,
  user,
  testIdPrefix
}: {
  product: HttpTypes.StoreProduct & {
    calculated_amount: number;
    currency_code: string;
  };
  wishlist: Wishlist;
  user?: HttpTypes.StoreCustomer | null;
  testIdPrefix?: string;
}) => {
  const { cheapestPrice } = getProductPrice({ product });
  const price = convertToLocale({
    amount: cheapestPrice?.calculated_price_number,
    currency_code: cheapestPrice?.currency_code
  });

  return (
    <div
      className={clsx(
        "relative group border rounded-sm flex flex-col justify-between p-1 w-[250px] lg:w-[370px]"
      )}
      data-testid={testIdPrefix}
    >
      <div className="relative w-full h-full bg-primary aspect-square">
        <div className="absolute right-3 top-3 z-10 cursor-pointer">
          <WishlistButton
            productId={product.id}
            wishlist={wishlist}
            user={user}
          />
        </div>
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <div className="overflow-hidden rounded-sm w-full h-full flex justify-center align-center ">
            {product.thumbnail ? (
              <Image
                src={decodeURIComponent(product.thumbnail)}
                alt={product.title}
                width={360}
                height={360}
                className="object-cover aspect-square w-full object-center h-full lg:group-hover:-mt-14 transition-all duration-300 rounded-xs"
                priority
                data-testid={testIdPrefix ? `${testIdPrefix}-thumbnail` : undefined}
              />
            ) : (
              <Image
                src="/images/placeholder.svg"
                alt="Product placeholder"
                width={100}
                height={100}
                className="flex margin-auto w-[100px] h-auto"
                data-testid={testIdPrefix ? `${testIdPrefix}-placeholder` : undefined}
              />
            )}
          </div>
        </LocalizedClientLink>
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <Button className="absolute rounded-sm bg-action text-action-on-primary h-auto lg:h-[48px] lg:group-hover:block hidden w-full uppercase bottom-1 z-10" data-testid={testIdPrefix ? `${testIdPrefix}-see-more-button` : undefined}>
            See More
          </Button>
        </LocalizedClientLink>
      </div>
      <LocalizedClientLink href={`/products/${product.handle}`}>
        <div className="flex justify-between p-4">
          <div className="w-full">
            <h3 className="heading-sm truncate" data-testid={testIdPrefix ? `${testIdPrefix}-title` : undefined}>{product.title}</h3>
            <div className="flex items-center gap-2 mt-2" data-testid={testIdPrefix ? `${testIdPrefix}-price` : undefined}>{price}</div>
          </div>
        </div>
      </LocalizedClientLink>
    </div>
  )
}
