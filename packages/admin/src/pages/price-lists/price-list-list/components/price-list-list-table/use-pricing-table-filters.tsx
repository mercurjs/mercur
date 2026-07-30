import { useTranslation } from "react-i18next"
import { Filter } from "../../../../../components/table/data-table"

export const usePricingTableFilters = () => {
  const { t } = useTranslation()

  const filters: Filter[] = [
    {
      label: t("priceLists.fields.type.label"),
      key: "type",
      type: "select",
      options: [
        {
          label: t("priceLists.fields.type.options.sale.label"),
          value: "sale",
        },
        {
          label: t("priceLists.fields.type.options.override.label"),
          value: "override",
        },
      ],
    },
    {
      label: t("priceLists.fields.status.label"),
      key: "status",
      type: "select",
      options: [
        {
          label: t("priceLists.fields.status.options.active"),
          value: "active",
        },
        {
          label: t("priceLists.fields.status.options.draft"),
          value: "draft",
        },
      ],
    },
    { label: t("fields.createdAt"), key: "created_at", type: "date" },
    { label: t("fields.updatedAt"), key: "updated_at", type: "date" },
  ]

  return filters
}
