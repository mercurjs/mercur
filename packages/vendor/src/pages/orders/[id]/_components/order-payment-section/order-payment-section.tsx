import { ArrowDownRightMini, DocumentText } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Badge,
  Container,
  Heading,
  StatusBadge,
  Text,
  Tooltip,
} from "@medusajs/ui"

import { useTranslation } from "react-i18next"

import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import { ActionMenu } from "@components/common/action-menu"
import DisplayId from "@components/common/display-id/display-id"
import { getLocaleAmount, getStylizedAmount } from "@lib/money-amount-helpers"
import { getOrderPaymentStatus } from "@lib/order-helpers"
import { getTotalCaptured, getTotalPending } from "@lib/payment"
import { useDate } from "@hooks/use-date"

type PaymentRefund = {
  id: string
  amount?: number
  created_at?: string | null
  note?: string | null
  refund_reason?: { label?: string | null } | null
}

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
  const payments = getPaymentsFromOrder(order) ?? []

  return (
    <Container className="divide-y divide-dashed p-0">
      <Header order={order} />
      {payments.length > 0 && (
        <div className="divide-y divide-dashed">
          {payments.map((payment) => (
            <PaymentRow key={payment.id} order={order} payment={payment} />
          ))}
        </div>
      )}
      <Total order={order} />
      <DisplayExtensionZone model="order" zone="payment" data={order} />
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

      {order.status !== "canceled" && totalPending > 0 && (
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            {t("orders.payment.totalPending")}
          </Text>

          <Text size="small" weight="plus" leading="compact">
            {getStylizedAmount(totalPending, order.currency_code)}
          </Text>
        </div>
      )}
    </div>
  )
}

const getPaymentStatus = (
  payment: HttpTypes.AdminPayment
): { labelKey: string; color: "green" | "orange" | "red" } => {
  if (payment.canceled_at) {
    return { labelKey: "orders.payment.status.canceled", color: "red" }
  }
  if (payment.captured_at) {
    return { labelKey: "orders.payment.status.captured", color: "green" }
  }
  return { labelKey: "orders.payment.status.pending", color: "orange" }
}

const PaymentRow = ({
  order,
  payment,
}: {
  order: HttpTypes.AdminOrder
  payment: HttpTypes.AdminPayment
}) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  const status = getPaymentStatus(payment)
  const refunds = (payment.refunds ?? []) as unknown as PaymentRefund[]
  const refundedAmount = refunds.reduce((acc, r) => acc + (r.amount ?? 0), 0)
  const isFullyRefunded =
    refundedAmount > 0 && refundedAmount >= (payment.amount as number)
  const canRefund =
    !!payment.captured_at && !payment.canceled_at && !isFullyRefunded

  return (
    <div className="divide-y divide-dashed" data-testid={`payment-row-${payment.id}`}>
      <div className="text-ui-fg-subtle grid grid-cols-[1fr_1fr_1fr_20px] items-center gap-x-4 px-6 py-4 sm:grid-cols-[1fr_1fr_1fr_1fr_20px]">
        <div className="w-full min-w-[60px] overflow-hidden">
          <Text size="small" leading="compact" weight="plus" className="truncate">
            <DisplayId id={payment.id} />
          </Text>
          <Text size="small" leading="compact">
            {payment.created_at
              ? getFullDate({ date: payment.created_at, includeTime: true })
              : null}
          </Text>
        </div>

        <div className="hidden items-center justify-end sm:flex">
          <Text size="small" leading="compact" className="capitalize">
            {payment.provider_id}
          </Text>
        </div>

        <div className="flex items-center justify-end">
          <StatusBadge color={status.color} className="text-nowrap">
            {t(status.labelKey)}
          </StatusBadge>
        </div>

        <div className="flex items-center justify-end">
          <Text size="small" leading="compact">
            {getLocaleAmount(payment.amount as number, order.currency_code)}
          </Text>
        </div>

        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("orders.payment.createRefund"),
                  icon: <ArrowDownRightMini />,
                  to: `/orders/${order.id}/refund?payment_id=${payment.id}`,
                  disabled: !canRefund,
                },
              ],
            },
          ]}
        />
      </div>

      {refunds.map((refund) => (
        <RefundRow
          key={refund.id}
          refund={refund}
          currencyCode={order.currency_code}
        />
      ))}
    </div>
  )
}

const RefundRow = ({
  refund,
  currencyCode,
}: {
  refund: PaymentRefund
  currencyCode: string
}) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  const reasonLabel = refund.refund_reason?.label ?? null

  return (
    <div
      className="bg-ui-bg-subtle text-ui-fg-subtle grid grid-cols-[1fr_1fr_1fr_20px] items-center gap-x-4 px-6 py-4"
      data-testid={`refund-row-${refund.id}`}
    >
      <div className="flex flex-row">
        <div className="self-center pr-3">
          <ArrowDownRightMini className="text-ui-fg-muted" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-x-1">
            <Text size="small" leading="compact" weight="plus">
              {t("orders.payment.refund")}
            </Text>
            {refund.note && (
              <Tooltip content={refund.note}>
                <DocumentText className="text-ui-tag-neutral-icon inline" />
              </Tooltip>
            )}
          </div>
          {refund.created_at && (
            <Text size="small" leading="compact">
              {getFullDate({ date: refund.created_at, includeTime: true })}
            </Text>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end">
        {reasonLabel && (
          <Badge
            size="2xsmall"
            className="cursor-default select-none capitalize"
            rounded="full"
          >
            {reasonLabel}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-end">
        <Text size="small" leading="compact">
          {`- ${getLocaleAmount(refund.amount ?? 0, currencyCode)}`}
        </Text>
      </div>
    </div>
  )
}
