import { HttpTypes } from "@medusajs/types"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"

import { useTranslation } from "react-i18next"

import { getStylizedAmount } from "@lib/money-amount-helpers"
import { getOrderPaymentStatus } from "@lib/order-helpers"
import { getTotalCaptured, getTotalPending } from "@lib/payment"

type OrderPaymentSectionProps = {
  order: HttpTypes.AdminOrder
}

export const getPaymentsFromOrder = (order: HttpTypes.AdminOrder) => {
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

const Header = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{t("orders.payment.title")}</Heading>

      {order.payment_status && (
        <StatusBadge
          color={getOrderPaymentStatus(t, order.payment_status).color}
          className="text-nowrap"
        >
          {getOrderPaymentStatus(t, order.payment_status).label}
        </StatusBadge>
      )}
    </div>
  )
}

const Total = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  if (!order.payment_collections?.length) {
    return null
  }

  const paymentCollections = order.payment_collections
  const totalCaptured = getTotalCaptured(paymentCollections)
  const totalPending = getTotalPending(paymentCollections)
  const totalRefunded = paymentCollections.reduce(
    (acc, pc) => acc + ((pc.refunded_amount as number) || 0),
    0
  )

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4">
        <Text size="small" weight="plus" leading="compact">
          {t("orders.payment.totalPaidByCustomer")}
        </Text>

        <Text size="small" weight="plus" leading="compact">
          {getStylizedAmount(totalCaptured, order.currency_code)}
        </Text>
      </div>

      {totalRefunded > 0 && (
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            Refunded
          </Text>

          <Text size="small" weight="plus" leading="compact">
            {getStylizedAmount(totalRefunded, order.currency_code)}
          </Text>
        </div>
      )}

      {order.status !== "canceled" && totalPending > 0 && (
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            Total pending
          </Text>

          <Text size="small" weight="plus" leading="compact">
            {getStylizedAmount(totalPending, order.currency_code)}
          </Text>
        </div>
      )}
    </div>
  )
}
