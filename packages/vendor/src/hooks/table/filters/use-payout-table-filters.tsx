import { useTranslation } from "react-i18next"
import { useMemo } from "react"

import type { Filter } from "../../../components/table/data-table"

export const usePayoutTableFilters = (): Filter[] => {
  const { t } = useTranslation()

  return useMemo(() => {
    const filters: Filter[] = []

    const statusFilter: Filter = {
      key: "status",
      label: t("fields.status"),
      type: "select",
      multiple: true,
      options: [
        { label: t("payouts.status.pending"), value: "pending" },
        { label: t("payouts.status.processing"), value: "processing" },
        { label: t("payouts.status.paid"), value: "paid" },
        { label: t("payouts.status.failed"), value: "failed" },
        { label: t("payouts.status.canceled"), value: "canceled" },
      ],
    }

    filters.push(statusFilter)

    const dateFilters: Filter[] = [
      { label: t("fields.createdAt"), key: "created_at" },
      { label: t("fields.updatedAt"), key: "updated_at" },
    ].map((f) => ({
      key: f.key,
      label: f.label,
      type: "date",
    }))

    filters.push(...dateFilters)

    return filters
  }, [t])
}
