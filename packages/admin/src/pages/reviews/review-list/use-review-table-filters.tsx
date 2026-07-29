import { useTranslation } from "react-i18next"

import { Filter } from "../../../components/table/data-table"

export const useReviewTableFilters = (): Filter[] => {
  const { t } = useTranslation()

  const filters: Filter[] = [
    {
      key: "rating",
      label: t("reviews.fields.rating"),
      type: "select",
      multiple: true,
      options: [1, 2, 3, 4, 5].map((value) => ({
        label: t("reviews.filters.stars", { count: value }),
        value: String(value),
      })),
    },
    {
      key: "status",
      label: t("reviews.fields.status"),
      type: "select",
      multiple: true,
      options: (["pending", "published", "rejected"] as const).map(
        (value) => ({
          label: t(`reviews.status.${value}`),
          value,
        })
      ),
    },
  ]

  const dateFilters: Filter[] = [
    { label: t("fields.createdAt"), key: "created_at" },
    { label: t("fields.updatedAt"), key: "updated_at" },
  ].map((f) => ({
    key: f.key,
    label: f.label,
    type: "date",
  }))

  return [...filters, ...dateFilters]
}
