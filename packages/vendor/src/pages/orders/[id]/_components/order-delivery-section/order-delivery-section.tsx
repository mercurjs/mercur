import { HttpTypes } from "@medusajs/types"
import { Container, Heading, StatusBadge, Text, clx } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SectionRow } from "@components/common/section"

import {
  getExpectedDelivery,
  getShipByState,
} from "../../../common/expected-delivery"
import { useExpectedDeliveryFormat } from "../../../common/use-expected-delivery-format"

type OrderDeliverySectionProps = {
  order: HttpTypes.AdminOrder
}

export const OrderDeliverySection = ({ order }: OrderDeliverySectionProps) => {
  const { t } = useTranslation()
  const { formatCalendarDate, formatDeliveryWindow } =
    useExpectedDeliveryFormat()

  const delivery = getExpectedDelivery(order.metadata)

  if (!delivery) {
    return null
  }

  const shipByState = getShipByState(order, delivery.shipping_deadline)

  return (
    <Container className="divide-y p-0" data-testid="order-delivery-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid="order-delivery-section-heading">
          {t("orders.delivery.title")}
        </Heading>
        {shipByState && (
          <StatusBadge
            color={shipByState === "overdue" ? "red" : "orange"}
            className="text-nowrap"
            data-testid="order-delivery-section-ship-by-badge"
          >
            {shipByState === "overdue"
              ? t("orders.delivery.overdue")
              : t("orders.delivery.dueToday")}
          </StatusBadge>
        )}
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center gap-4 px-6 py-4">
        <Text size="small" weight="plus" leading="compact">
          {t("orders.delivery.shipBy")}
        </Text>
        <Text
          size="small"
          weight="plus"
          leading="compact"
          className={clx(
            shipByState === "overdue" && "text-ui-fg-error",
            shipByState === "due_today" && "text-ui-tag-orange-text",
            !shipByState && "text-ui-fg-base"
          )}
          data-testid="order-delivery-section-ship-by"
        >
          {formatCalendarDate(delivery.shipping_deadline)}
        </Text>
      </div>
      <SectionRow
        title={t("orders.delivery.expectedDelivery")}
        value={formatDeliveryWindow(delivery)}
      />
    </Container>
  )
}
