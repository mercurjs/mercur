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
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Paid", value: "paid" },
        { label: "Failed", value: "failed" },
        { label: "Canceled", value: "canceled" },
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
