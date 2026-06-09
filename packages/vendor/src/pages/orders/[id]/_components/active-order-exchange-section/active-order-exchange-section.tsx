import { ArrowPath } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useCancelExchangeBegin } from "@hooks/api/exchanges"

/**
 * Striped banner shown above the order header while an exchange draft
 * is in flight. Ported from Medusa admin's `ActiveOrderExchangeSection`.
 * Vendor side uses `useCancelExchangeBegin` (`DELETE /vendor/exchanges/
 * :id/request`) which is the route equivalent of admin's
 * `useCancelExchangeRequest`.
 */
type ActiveOrderExchangeSectionProps = {
  orderPreview: HttpTypes.AdminOrderPreview
}

const readExchangeId = (change: unknown): string | undefined => {
  if (
    change &&
    typeof change === "object" &&
    "exchange_id" in change &&
    typeof (change as { exchange_id?: unknown }).exchange_id === "string"
  ) {
    return (change as { exchange_id: string }).exchange_id
  }
  return undefined
}

export const ActiveOrderExchangeSection = ({
  orderPreview,
}: ActiveOrderExchangeSectionProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const exchangeId = readExchangeId(orderPreview?.order_change)

  const { mutateAsync: cancelExchange } = useCancelExchangeBegin(
    exchangeId ?? "",
    orderPreview.id
  )

  if (!exchangeId) {
    return null
  }

  const onContinueExchange = async () => {
    navigate(`/orders/${orderPreview.id}/exchanges/create`)
  }

  const onCancelExchange = async () => {
    await cancelExchange(undefined, {
      onSuccess: () => {
        toast.success(t("orders.exchanges.toast.canceledSuccessfully"))
      },
      onError: (error: Error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <div
      style={{
        background:
          "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
      }}
      className="-m-4 mb-1 border-b border-l p-4"
      data-testid="active-order-exchange-section"
    >
      <Container className="flex items-center justify-between p-0">
        <div className="flex w-full flex-row justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 px-6 pt-4">
              <ArrowPath className="text-ui-fg-subtle" />
              <Heading level="h2">{t("orders.exchanges.panel.title")}</Heading>
            </div>

            <div className="gap-2 px-6 pb-4">
              <Text>{t("orders.exchanges.panel.description")}</Text>
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
            <Button
              size="small"
              variant="secondary"
              onClick={onCancelExchange}
              data-testid="active-order-exchange-cancel"
            >
              {t("orders.exchanges.cancel.title")}
            </Button>

            <Button
              size="small"
              variant="secondary"
              onClick={onContinueExchange}
              data-testid="active-order-exchange-continue"
            >
              {t("actions.continue")}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}
