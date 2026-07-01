import { LoginForm, UserNavigation } from "@/components/molecules"
import { ReviewsWritten } from "@/components/organisms"
import { retrieveCustomer } from "@/lib/data/customer"
import { listOrders } from "@/lib/data/orders"
import { getReviews } from "@/lib/data/reviews"

export default async function Page() {
  const user = await retrieveCustomer()

  const reviewsRes = await getReviews()
  const orders = await listOrders()

  if (!user) return <LoginForm />

  return (
    <main className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <ReviewsWritten
          orders={orders.filter((order) => order.reviews.length)}
          reviews={reviewsRes.data?.reviews.filter(Boolean) ?? []}
          isError={!reviewsRes.ok}
        />
      </div>
    </main>
  )
}
