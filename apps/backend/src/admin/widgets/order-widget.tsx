import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useNavigate, useParams } from "react-router-dom"
import { useOrderSet } from "../hooks/api/seller"
import { ArrowLongRight } from "@medusajs/icons"

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
            <Button variant="secondary" key={order.id} className="cursor-pointer w-full flex text-left items-center justify-between mt-4" onClick={() => {
              navigate(`/orders/${order.id}`)
            }}>
              <div className="w-full relative">
                <Heading level="h3" className="text-md font-medium">#{order.display_id}</Heading>
                <Text className="truncate">{items}</Text>
              </div>
              <ArrowLongRight className="text-ui-primary" />
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