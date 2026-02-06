import { useTranslation } from "react-i18next"

import type { Filter } from "../../../components/table/data-table"

export const useOrderTableFilters = (): Filter[] => {
  const { t } = useTranslation()

  let filters: Filter[] = []

  // Note: paymentStatusFilter is defined but not currently used
  // @ts-ignore - Filter preserved for future use
  const _paymentStatusFilter: Filter = {
    key: "payment_status",
    label: t("orders.payment.statusLabel"),
    type: "select",
    multiple: true,
    options: [
      {
        label: t("orders.payment.status.notPaid"),
        value: "not_paid",
      },
      {
        label: t("orders.payment.status.awaiting"),
        value: "awaiting",
      },
      {
        label: t("orders.payment.status.captured"),
        value: "captured",
      },
      {
        label: t("orders.payment.status.refunded"),
        value: "refunded",
      },
      {
        label: t("orders.payment.status.partiallyRefunded"),
        value: "partially_refunded",
      },
      {
        label: t("orders.payment.status.canceled"),
        value: "canceled",
      },
      {
        label: t("orders.payment.status.requiresAction"),
        value: "requires_action",
      },
    ],
  }

  const dateFilters: Filter[] = [
    { label: "Created At", key: "created_at" },
    { label: "Updated At", key: "updated_at" },
  ].map((f) => ({
    key: f.key,
    label: f.label,
    type: "date",
  }))

  filters = [
    ...filters,
    // TODO: enable when Payment, Fulfillments <> Orders are linked
    // paymentStatusFilter,
    // fulfillmentStatusFilter,
    ...dateFilters,
  ]

  return filters
}
