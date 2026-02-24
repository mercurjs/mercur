import { Text } from "@medusajs/ui"
import { AdminExchange, AdminReturn } from "@medusajs/types"
import { useTranslation } from "react-i18next"

type ExchangeBodyProps = {
  exchange: AdminExchange
  exchangeReturn?: AdminReturn
}

export const ExchangeBody = ({
  exchange,
  exchangeReturn,
}: ExchangeBodyProps) => {
  const { t } = useTranslation()

  const outboundItems = (exchange.additional_items || []).reduce(
    (acc, item) => (acc + item.quantity) as number,
    0
  )

  const inboundItems = (exchangeReturn?.items || []).reduce(
    (acc, item) => acc + item.quantity,
    0
  )

  return (
    <div>
      {outboundItems > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          {t("orders.activity.events.exchange.itemsInbound", {
            count: outboundItems,
          })}
        </Text>
      )}

      {inboundItems > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          {t("orders.activity.events.exchange.itemsOutbound", {
            count: inboundItems,
          })}
        </Text>
      )}
    </div>
  )
}
