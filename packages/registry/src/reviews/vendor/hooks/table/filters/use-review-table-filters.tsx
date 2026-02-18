import { useTranslation } from "react-i18next"
import { useMemo } from "react"

import type { Filter } from "@mercurjs/dashboard-shared/src/components/table/data-table"

export const useReviewTableFilters = (): Filter[] => {
  const { t } = useTranslation()

  return useMemo(() => {
    const filters: Filter[] = []

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
