import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { OrderReturnSection } from "@/components/sections/OrderReturnSection/OrderReturnSection"
import {
  retrieveOrder,
  retrieveReturnReasons,
  retriveReturnMethods,
} from "@/lib/data/orders"

export default function ReturnOrderPage(props: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <ReturnOrderPageContent {...props} />
    </Suspense>
  )
}

async function ReturnOrderPageContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const order = (await retrieveOrder(id)) as any
  const returnReasons = await retrieveReturnReasons()
  const returnMethods = await retriveReturnMethods(id)

  return (
    <main className="container">
      <OrderReturnSection
        order={order}
        returnReasons={returnReasons}
        shippingMethods={returnMethods as any}
      />
    </main>
  )
}
