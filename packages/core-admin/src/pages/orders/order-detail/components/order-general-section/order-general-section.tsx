import { XCircle } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Container,
  Copy,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useCancelOrder } from "../../../../../hooks/api/orders"
import { useDate } from "../../../../../hooks/use-date"
import {
  getCanceledOrderStatus,
  getOrderFulfillmentStatus,
  getOrderPaymentStatus,
} from "../../../../../lib/order-helpers"

type OrderGeneralSectionProps = {
  order: HttpTypes.AdminOrder
}

export const OrderGeneralSection = ({ order }: OrderGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { getFullDate } = useDate()

  const { mutateAsync: cancelOrder } = useCancelOrder(order.id)

  const handleCancel = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("orders.cancelWarning", {
        id: `#${order.display_id}`,
      }),
      confirmText: t("actions.continue"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await cancelOrder(undefined, {
      onSuccess: () => {
        toast.success(t("orders.orderCanceled"))
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  return (
    <Container className="flex items-center justify-between px-6 py-4" data-testid="order-general-section">
      <div>
        <div className="flex items-center gap-x-1" data-testid="order-general-section-id-container">
          <Heading data-testid="order-general-section-id-heading">#{order.display_id}</Heading>
          <Copy content={`#${order.display_id}`} className="text-ui-fg-muted" data-testid="order-general-section-id-copy" />
        </div>
        <Text size="small" className="text-ui-fg-subtle" data-testid="order-general-section-date">
          {t("orders.onDateFromSalesChannel", {
            date: getFullDate({ date: order.created_at, includeTime: true }),
            salesChannel: order.sales_channel?.name,
          })}
        </Text>
      </div>
      <div className="flex items-center gap-x-4" data-testid="order-general-section-badges-container">
        <div className="flex items-center gap-x-1.5" data-testid="order-general-section-badges">
          <OrderBadge order={order} />
          <PaymentBadge order={order} />
          <FulfillmentBadge order={order} />
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.cancel"),
                  onClick: handleCancel,
                  disabled: !!order.canceled_at,
                  icon: <XCircle />,
                },
              ],
            },
          ]}
          data-testid="order-general-section-action-menu"
        />
      </div>
    </Container>
  )
}

const FulfillmentBadge = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  const { label, color } = getOrderFulfillmentStatus(
    t,
    order.fulfillment_status
  )

  return (
    <StatusBadge color={color} className="text-nowrap" data-testid="order-general-section-fulfillment-badge">
      {label}
    </StatusBadge>
  )
}

const PaymentBadge = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  const { label, color } = getOrderPaymentStatus(t, order.payment_status)

  return (
    <StatusBadge color={color} className="text-nowrap" data-testid="order-general-section-payment-badge">
      {label}
    </StatusBadge>
  )
}

const OrderBadge = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()
  const orderStatus = getCanceledOrderStatus(t, order.status)

  if (!orderStatus) {
    return null
  }

  return (
    <StatusBadge color={orderStatus.color} className="text-nowrap" data-testid="order-general-section-order-badge">
      {orderStatus.label}
    </StatusBadge>
  )
}
