import { useTranslation } from "react-i18next"
import { Filter } from "../../../components/table/data-table"
import { useSellers } from "../../api/sellers"

export const useCustomerGroupTableFilters = () => {
  const { t } = useTranslation()

  const { sellers } = useSellers({
    limit: 1000,
    fields: "id,name",
  })

  let filters: Filter[] = []

  if (sellers?.length) {
    filters.push({
      key: "seller_id",
      label: t("fields.owner"),
      type: "select",
      multiple: true,
      searchable: true,
      options: sellers.map((s) => ({
        label: s.name,
        value: s.id,
      })),
    })
  }

  const dateFilters: Filter[] = [
    { label: t("fields.createdAt"), key: "created_at" },
    { label: t("fields.updatedAt"), key: "updated_at" },
  ].map((f) => ({
    key: f.key,
    label: f.label,
    type: "date",
  }))

  filters = [...filters, ...dateFilters]

  return filters
}
