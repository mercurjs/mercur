import { UserNavigation } from "@/components/molecules"
import { retrieveCustomer } from "@/lib/data/customer"
import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowLeftIcon } from "@/icons"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { retrieveOrderSet } from "@/lib/data/orders"
import { OrderDetailsSection } from "@/components/sections/OrderDetailsSection/OrderDetailsSection"

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const user = await retrieveCustomer()
  const orderSet = await retrieveOrderSet(id)

  if (!user) return redirect("/login")

  return (
    <main className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3">
          <LocalizedClientLink href="/user/orders">
            <Button
              variant="tonal"
              className="label-md text-action-on-secondary uppercase flex items-center gap-2"
            >
              <ArrowLeftIcon className="size-4" />
              All orders
            </Button>
          </LocalizedClientLink>
          <div className="sm:flex items-center justify-between">
            <h1 className="heading-md uppercase my-8">
              Order set #{orderSet.display_id}
            </h1>
            <p className="label-md text-secondary">
              Order date:{" "}
              <span className="text-primary">
                {format(orderSet.created_at || "", "yyyy-MM-dd")}
              </span>
            </p>
          </div>
          <OrderDetailsSection orderSet={orderSet} />
        </div>
      </div>
    </main>
  )
}
