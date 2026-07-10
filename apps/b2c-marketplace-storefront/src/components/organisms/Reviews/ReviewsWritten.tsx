"use client"
import { navigation } from "./navigation"
import { Card, NavigationItem } from "@/components/atoms"
import { Order, Review } from "@/lib/data/reviews"
import { isEmpty } from "lodash"
import { usePathname } from "next/navigation"
import { OrderCard } from "./OrderCard"
import { RefreshButton } from "@/components/cells/RefreshButton/RefreshButton"

export const ReviewsWritten = ({
  reviews,
  orders,
  isError,
}: {
  reviews: Review[]
  orders: Order[]
  isError: boolean
}) => {
  const pathname = usePathname()

  function renderReviews() {
    if (isError) {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-negative">
            Something went wrong while fetching reviews
          </p>
          <RefreshButton label="Refresh" />
        </div>
      )
    }

    if (isEmpty(reviews)) {
      return (
        <Card>
          <div className="text-center py-6">
            <h3 className="heading-lg text-primary uppercase">
              No written reviews
            </h3>
            <p className="text-lg text-secondary mt-2">
              You haven&apos;t written any reviews yet. Once you write a review,
              it will appear here.
            </p>
          </div>
        </Card>
      )
    }

    return (
      <div className="space-y-2">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    )
  }

  return (
    <div className="md:col-span-3 space-y-8">
      <h1 className="heading-md uppercase">Reviews</h1>
      <div className="flex gap-4">
        {navigation.map((item) => (
          <NavigationItem
            key={item.label}
            href={item.href}
            active={pathname === item.href}
            className="px-0"
          >
            {item.label}
          </NavigationItem>
        ))}
      </div>
      {renderReviews()}
    </div>
  )
}
