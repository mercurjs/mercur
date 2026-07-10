import { isStripe, paymentInfoMap } from "@/lib/constants"
import { convertToLocale } from "@/lib/helpers/money"
import { HttpTypes } from "@medusajs/types"
import { Container, Text } from "@medusajs/ui"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const OrderShipping = ({ order }: ShippingDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]

  return (
    <div className="border rounded-sm p-4">
      <div>
        <Text className="txt-medium-plus text-ui-fg-base mb-1 font-bold">
          Shipping Address
        </Text>
        <Text className="txt-medium text-ui-fg-subtle">
          {order.shipping_address?.first_name}{" "}
          {order.shipping_address?.last_name}
        </Text>
        <Text className="txt-medium text-ui-fg-subtle">
          {order.shipping_address?.address_1}{" "}
          {order.shipping_address?.address_2}
        </Text>
        <Text className="txt-medium text-ui-fg-subtle">
          {order.shipping_address?.postal_code}, {order.shipping_address?.city}
        </Text>
        <Text className="txt-medium text-ui-fg-subtle">
          {order.shipping_address?.country_code?.toUpperCase()}
        </Text>
      </div>

      <div className="mt-4" data-testid="shipping-contact-summary">
        <Text className="txt-medium-plus text-ui-fg-base mb-1 font-bold">
          Contact
        </Text>
        <Text className="txt-medium text-ui-fg-subtle">
          {order.shipping_address?.phone}
        </Text>
        <Text className="txt-medium text-ui-fg-subtle">{order.email}</Text>
      </div>

      <div className="mt-4" data-testid="shipping-method-summary">
        <Text className="txt-medium-plus text-ui-fg-base mb-1 font-bold">
          Delivery method
        </Text>
        <Text className="txt-medium text-ui-fg-subtle">
          {(order as any).shipping_methods[0]?.name} (
          {convertToLocale({
            amount: order.shipping_methods?.[0].total ?? 0,
            currency_code: order.currency_code,
          })
            .replace(/,/g, "")
            .replace(/\./g, ",")}
          )
        </Text>
      </div>
      <div className="mt-4">
        <Text className="txt-medium-plus text-ui-fg-base mb-1 font-bold">
          Payment method
        </Text>
        <div>
          {payment && (
            <div className="flex items-start gap-x-1 w-full">
              <div>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method"
                >
                  {paymentInfoMap[payment.provider_id].title}
                </Text>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderShipping
