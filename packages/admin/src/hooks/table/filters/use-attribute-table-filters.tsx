import { useTranslation } from "react-i18next"
import { Filter } from "../../../components/table/data-table"

export const useAttributeTableFilters = () => {
  const { t } = useTranslation()

  const filterableFilter: Filter = {
    key: "is_filterable",
    label: t("attributes.fields.filterable"),
    type: "select",
    options: [
      {
        label: t("filters.radio.yes"),
        value: "true",
      },
      {
        label: t("filters.radio.no"),
        value: "false",
      },
    ],
  }

  const internalFilter: Filter = {
    key: "is_internal",
    label: t("attributes.fields.visibility.label"),
    type: "select",
    options: [
      {
        label: t("attributes.fields.visibility.internal"),
        value: "true",
      },
      {
        label: t("attributes.fields.visibility.public"),
        value: "false",
      },
    ],
  }

  const dateFilters: Filter[] = [
    { label: t("fields.createdAt"), key: "created_at" },
    { label: t("fields.updatedAt"), key: "updated_at" },
  ].map((f) => ({
    key: f.key,
    label: f.label,
    type: "date" as const,
  }))

  return [filterableFilter, internalFilter, ...dateFilters]
}
