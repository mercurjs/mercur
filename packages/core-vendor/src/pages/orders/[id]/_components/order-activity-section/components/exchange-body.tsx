import { Button, Text, usePrompt } from "@medusajs/ui"
import { AdminExchange, AdminReturn } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { useCancelExchange } from "@hooks/api/exchanges"

type ExchangeBodyProps = {
  exchange: AdminExchange
  exchangeReturn?: AdminReturn
}

export const ExchangeBody = ({
  exchange,
  exchangeReturn,
}: ExchangeBodyProps) => {
  const prompt = usePrompt()
  const { t } = useTranslation()

  const isCanceled = !!exchange.canceled_at

  const { mutateAsync: cancelExchange } = useCancelExchange(
    exchange.id,
    exchange.order_id
  )

  const onCancel = async () => {
    const res = await prompt({
      title: t("orders.exchanges.cancel.title"),
      description: t("orders.exchanges.cancel.description"),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await cancelExchange()
  }

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

      {!isCanceled && (
        <Button
          onClick={onCancel}
          className="text-ui-fg-subtle h-auto px-0 leading-none hover:bg-transparent"
          variant="transparent"
          size="small"
        >
          {t("actions.cancel")}
        </Button>
      )}
    </div>
  )
}

