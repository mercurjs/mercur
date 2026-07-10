import { OrderReturnSection } from "@/components/sections/OrderReturnSection/OrderReturnSection"
import {
  retrieveOrder,
  retrieveReturnReasons,
  retriveReturnMethods,
} from "@/lib/data/orders"

export default async function ReturnOrderPage({
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
