// Route: /orders/:id/refund?payment_id=...
//
// Thin route entry. Mirrors admin's `/admin/orders/:id/refund` layout
// (`order-create-refund.tsx`). Data loading + drawer shell live here;
// the form lives in `_components/create-refund-form/`.
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { Heading } from "@medusajs/ui"

import { RouteDrawer } from "@components/modals"
import { useOrder } from "@hooks/api/orders"

import { CreateRefundForm } from "./_components/create-refund-form"

export const Component = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const orderId = id ?? ""

  const { order, isLoading, isError, error } = useOrder(orderId, {
    fields: "+currency_code,*payment_collections.payments.refunds",
  })

  if (isError) {
    throw error
  }

  const ready = !isLoading && !!order

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("orders.payment.createRefund")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("orders.payment.createRefund")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>

      {ready && <CreateRefundForm order={order} />}
    </RouteDrawer>
  )
}

export default Component
