import OrderDetails from "@/components/organisms/OrderDefails/OrderDetails"
import OrderShipping from "@/components/organisms/OrderDefails/OrderShipping"
import OrderTotals from "@/components/organisms/OrderDefails/OrderTotals"
import OrderItems from "@/components/organisms/OrderItems/OrderItems"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

export const OrderConfirmedSection = ({
  order,
}: {
  order: HttpTypes.StoreOrder
}) => {
  return (
    <div className="py-6">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full mx-auto">
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <div className="text-center w-full">
            <Heading
              level="h1"
              className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
            >
              <span>Thank you!</span>
              <span>Your order was placed successfully.</span>
            </Heading>

            <Text>
              We have sent the order confirmation details to{" "}
              <span
                className="text-ui-fg-medium-plus font-semibold"
                data-testid="order-email"
              >
                {order.email}
              </span>
              .
            </Text>
          </div>
          {/* <OrderDetails order={order} />
          <OrderItems order={order} />
          <OrderTotals totals={order} />
          <OrderShipping order={order} /> */}
          {/*<PaymentDetails order={order} />
          <Help /> */}
        </div>
      </div>
    </div>
  )
}
