import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { format } from "date-fns"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div className="border rounded-sm p-4 bg-ui-bg-subtle grid lg:grid-cols-2">
      <Text className="mt-2">
        <span className="font-bold block">Order date</span>
        <span>{format(order.created_at, "dd-MM-yyyy")}</span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        <span className="font-bold block">Order number</span> #
        <span>{order.display_id}</span>
      </Text>
      {showStatus && (
        <div className="lg:col-span-2 flex items-center text-compact-small gap-x-4 mt-4">
          <>
            <Text>
              Order status:{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {/* TODO: Check where the statuses should come from */}
                {/* {formatStatus(order.fulfillment_status)} */}
              </span>
            </Text>
            <Text>
              Payment status:{" "}
              <span
                className="text-ui-fg-subtle "
                sata-testid="order-payment-status"
              >
                {/* {formatStatus(order.payment_status)} */}
              </span>
            </Text>
          </>
        </div>
      )}
    </div>
  )
}

export default OrderDetails
