import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import type { Filter } from "../../../components/table/data-table"

export const useCampaignTableFilters = (): Filter[] => {
  const { t } = useTranslation()

  return useMemo(() => {
    const typeFilter: Filter = {
      key: "budget_type",
      label: t("campaigns.fields.type"),
      type: "select",
      options: [
        { label: t("campaigns.budget.type.spend.title"), value: "spend" },
        { label: t("campaigns.budget.type.usage.title"), value: "usage" },
      ],
    }

    const statusFilter: Filter = {
      key: "status",
      label: t("fields.status"),
      type: "select",
      options: [
        { label: t("campaigns.status.active"), value: "active" },
        { label: t("campaigns.status.scheduled"), value: "scheduled" },
        { label: t("campaigns.status.expired"), value: "expired" },
      ],
    }

    const dateFilters: Filter[] = [
      { label: t("fields.createdAt"), key: "created_at", type: "date" },
      { label: t("fields.updatedAt"), key: "updated_at", type: "date" },
    ]

    return [typeFilter, statusFilter, ...dateFilters]
  }, [t])
}
