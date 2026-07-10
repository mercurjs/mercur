import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

export function CartEmpty() {
  return (
    <div className="col-span-12 pt-4 py-6 flex justify-center" data-testid="cart-empty">
      <div className="w-[466px] flex flex-col">
        <h2 className="text-primary heading-lg text-center">SHOPPING CART</h2>
        <p className="mt-2 text-lg text-secondary text-center">
          Your shopping cart is currently empty
        </p>
        <LocalizedClientLink href="/categories" className="mt-6">
          <Button className="w-full py-3 flex justify-center items-center">
            Explore
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}
