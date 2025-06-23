import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useNavigate, useParams } from "react-router-dom"
import { useOrderSet } from "../hooks/api/seller"
import { PaymentStatusBadge } from "../components/payments-status-badge/payment-status-badge"
import { OrderStatusBadge } from "../components/order-status-badge/order-status-badge"

const OrderWidget =  () => {
  const { id } =  useParams()
  const navigate = useNavigate()

  const {data, isLoading} =  useOrderSet(id!)

  
  if (isLoading) {
    return <div>Loading...</div>
  }

  const { order_sets } = data || {}

  const { orders } = order_sets?.[0] || {}

  return (
    <Container>
      <Heading level="h2" className="text-lg font-medium">Remaining orders group</Heading>
      <div>
        {orders.map((order: any) => {
          const items = order.items.length > 1 ? `${order.items[0].subtitle} + ${order.items.length - 1} more` : order.items[0].subtitle
          return (
            <Button variant="secondary" key={order.id} className="cursor-pointer w-full flex text-left mt-4" onClick={() => {
              navigate(`/orders/${order.id}`)
            }}>
              <div className="w-full relative">
                <div className="flex items-center justify-between gap-2">
                  <Heading level="h3" className="text-md font-medium w-1/3 truncate">#{order.display_id}</Heading>
                  <div className="flex w-2/3">
                    <Badge className="scale-75 -mr-8"><span className="text-xs mr-2">Payment</span><PaymentStatusBadge status={order.payment_collections[0].status} /></Badge>
                    <Badge className="scale-75 -mr-4"><span className="text-xs mr-2">Order</span><OrderStatusBadge status={order.status} /></Badge>
                  </div>
                </div>
                <Text className="truncate">{items}</Text>
              </div>
            </Button>
          )
        })}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
    zone: "order.details.side.after",
})  

export default OrderWidget