import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import type { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

export const config = defineWidgetConfig({
  zone: "orders.detail.summary.after",
})

type PaymentSession = NonNullable<
  HttpTypes.AdminPaymentCollection["payment_sessions"]
>[number]

/**
 * Turning an unpaid payment session into a copyable link is provider-specific:
 * the panel stays provider-agnostic and never assumes a shape for `session.data`.
 * Branch on `provider_id` for the providers your marketplace actually uses.
 */
const resolvePaymentLink = (session?: PaymentSession): string | null => {
  if (!session) {
    return null
  }

  const data = session.data as { url?: string } | undefined

  switch (session.provider_id) {
    case "pp_stripe_stripe":
      return data?.url ?? null
    default:
      return data?.url ?? null
  }
}

const formatAmount = (amount: number, currencyCode: string) =>
  new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: currencyCode,
  }).format(amount)

const OrderOutstandingPayment = ({
  data: order,
}: {
  data?: HttpTypes.AdminOrder
}) => {
  const { t } = useTranslation()

  if (!order) {
    return null
  }

  const unpaidCollection = order.payment_collections?.find(
    (pc) => pc.status !== "captured" && pc.status !== "canceled"
  )

  const pendingDifference = order.summary?.pending_difference ?? 0
  const isOutstanding =
    pendingDifference > 0.005 &&
    order.status !== "canceled" &&
    !!unpaidCollection

  if (!isOutstanding || !unpaidCollection) {
    return null
  }

  const paymentLink = resolvePaymentLink(unpaidCollection.payment_sessions?.[0])

  if (!paymentLink) {
    return null
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink)
      toast.success(t("orders.payment.copyLinkSuccess"))
    } catch {
      toast.error(t("orders.payment.copyLinkError"))
    }
  }

  return (
    <div className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
      <Button
        size="small"
        variant="secondary"
        onClick={handleCopyLink}
        data-testid="order-outstanding-copy-payment-link"
      >
        {t("orders.payment.copyPaymentLink", {
          amount: formatAmount(pendingDifference, order.currency_code),
        })}
      </Button>
    </div>
  )
}

export default OrderOutstandingPayment
