import { HttpTypes } from "@medusajs/types"
import { Text, clx } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { PlaceholderCell } from "@components/table/table-cells/common/placeholder-cell"

import {
  getExpectedDelivery,
  getShipByState,
} from "../../common/expected-delivery"
import { useExpectedDeliveryFormat } from "../../common/use-expected-delivery-format"

export const ShipByCell = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { formatCalendarDate } = useExpectedDeliveryFormat()
  const delivery = getExpectedDelivery(order.metadata)
  const label = delivery ? formatCalendarDate(delivery.shipping_deadline) : null

  if (!delivery || !label) {
    return <PlaceholderCell />
  }

  const state = getShipByState(order, delivery.shipping_deadline)

  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <Text
        size="small"
        leading="compact"
        className={clx(
          "truncate",
          state === "overdue" && "text-ui-fg-error",
          state === "due_today" && "text-ui-tag-orange-text"
        )}
        data-testid="order-list-ship-by-cell"
      >
        {label}
      </Text>
    </div>
  )
}

export const ShipByHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center">
      <span className="truncate">{t("orders.delivery.shipBy")}</span>
    </div>
  )
}
