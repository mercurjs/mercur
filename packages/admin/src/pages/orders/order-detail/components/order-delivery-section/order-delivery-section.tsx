import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { parseISO } from "date-fns"
import { useTranslation } from "react-i18next"

import { SectionRow } from "../../../../../components/common/section"
import { useDate } from "../../../../../hooks/use-date"

type ExpectedDeliveryMetadata = {
  shipping_deadline: string
  earliest: string | null
  latest: string | null
}

const isDateString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0

const isNullableDateString = (value: unknown): value is string | null =>
  value === null || value === undefined || isDateString(value)

const getExpectedDelivery = (
  metadata: Record<string, unknown> | null | undefined
): ExpectedDeliveryMetadata | null => {
  const value = metadata?.expected_delivery

  if (!value || typeof value !== "object") {
    return null
  }

  const { shipping_deadline, earliest, latest } = value as Record<
    string,
    unknown
  >

  if (
    !isDateString(shipping_deadline) ||
    !isNullableDateString(earliest) ||
    !isNullableDateString(latest)
  ) {
    return null
  }

  return {
    shipping_deadline,
    earliest: earliest ?? null,
    latest: latest ?? null,
  }
}

type OrderDeliverySectionProps = {
  order: HttpTypes.AdminOrder
}

export const OrderDeliverySection = ({ order }: OrderDeliverySectionProps) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  const delivery = getExpectedDelivery(order.metadata)

  if (!delivery) {
    return null
  }

  const formatDay = (date: string) => getFullDate({ date: parseISO(date) })

  const expected = [delivery.earliest, delivery.latest]
    .filter(isDateString)
    .filter((date, index, dates) => dates.indexOf(date) === index)
    .map(formatDay)
    .join(" – ")

  return (
    <Container className="divide-y p-0" data-testid="order-delivery-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid="order-delivery-heading">
          {t("orders.delivery.header")}
        </Heading>
      </div>
      <SectionRow
        title={t("orders.delivery.shipBy")}
        value={formatDay(delivery.shipping_deadline)}
      />
      <SectionRow
        title={t("orders.delivery.expectedDelivery")}
        value={expected || "—"}
      />
    </Container>
  )
}
