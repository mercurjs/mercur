import { HttpTypes } from "@medusajs/types"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"

import { useTranslation } from "react-i18next"

import { getStylizedAmount } from "@lib/money-amount-helpers"
import { getOrderPaymentStatus } from "@lib/order-helpers"
import { ExtendedAdminOrder } from "@custom-types/order"

type OrderPaymentSectionProps = {
  order: ExtendedAdminOrder
}

export const getPaymentsFromOrder = (order: HttpTypes.AdminOrder | ExtendedAdminOrder) => {
  return order.payment_collections
    ?.map((collection: HttpTypes.AdminPaymentCollection) => collection.payments)
    .flat(1)
    .filter(Boolean) as HttpTypes.AdminPayment[]
}

export const OrderPaymentSection = ({ order }: OrderPaymentSectionProps) => {
  return (
    <Container className="divide-y divide-dashed p-0">
      <Header order={order} />
      <Total order={order} />
    </Container>
  )
}

const Header = ({ order }: { order: ExtendedAdminOrder }) => {
  const { t } = useTranslation()
  const { label, color } = getOrderPaymentStatus(t, order.payment_status)

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{t("orders.payment.title")}</Heading>

      <StatusBadge color={color} className="text-nowrap">
        {label}
      </StatusBadge>
    </div>
  )
}

const Total = ({ order }: { order: ExtendedAdminOrder }) => {
  const { t } = useTranslation()
  
  if (!order.split_order_payment) {
    return null
  }
  
  const totalPending =
    order.split_order_payment.authorized_amount -
    order.split_order_payment.captured_amount

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4">
        <Text size="small" weight="plus" leading="compact">
          {t("orders.payment.totalPaidByCustomer")}
        </Text>

        <Text size="small" weight="plus" leading="compact">
          {getStylizedAmount(
            order.split_order_payment.captured_amount,
            order.split_order_payment.currency_code
          )}
        </Text>
      </div>

      {(order.split_order_payment.status === "refunded" ||
        order.split_order_payment.status === "partially_refunded") && (
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            Refunded
          </Text>

          <Text size="small" weight="plus" leading="compact">
            {getStylizedAmount(
              order.split_order_payment.refunded_amount,
              order.split_order_payment.currency_code
            )}
          </Text>
        </div>
      )}

      {order.status !== "canceled" && totalPending > 0 && (
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            Total pending
          </Text>

          <Text size="small" weight="plus" leading="compact">
            {getStylizedAmount(
              totalPending,
              order.split_order_payment.currency_code
            )}
          </Text>
        </div>
      )}
    </div>
  )
}
