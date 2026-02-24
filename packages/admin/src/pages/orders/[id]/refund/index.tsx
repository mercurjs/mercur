import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useOrder, usePlugins } from "@hooks/api"
import { getLoyaltyPlugin } from "@lib/plugins"
import { OrderBalanceSettlementForm } from "../balance-settlement/_components/order-balance-settlement-form"
import { DEFAULT_FIELDS } from "../constants"
import { CreateRefundForm } from "./_components/create-refund-form"

export const Component = () => {
  const { t } = useTranslation()
  const params = useParams()
  const { order } = useOrder(params.id!, {
    fields: DEFAULT_FIELDS,
  })

  const { plugins = [] } = usePlugins()
  const loyaltyPlugin = getLoyaltyPlugin(plugins)

  return (
    <RouteDrawer data-testid="order-create-refund-drawer">
      <RouteDrawer.Header data-testid="order-create-refund-header">
        <Heading data-testid="order-create-refund-heading">
          {t("orders.payment.createRefund")}
        </Heading>
      </RouteDrawer.Header>

      {order && !loyaltyPlugin && <CreateRefundForm order={order} />}
      {order && loyaltyPlugin && <OrderBalanceSettlementForm order={order} />}
    </RouteDrawer>
  )
}
