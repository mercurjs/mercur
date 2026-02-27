import { useTranslation } from "react-i18next"
import { Filter } from "../../../components/table/data-table"

export const useSellerTableFilters = (): Filter[] => {
  const { t } = useTranslation()

  const statusFilter: Filter = {
    key: "status",
    label: t("fields.status"),
    type: "select",
    multiple: true,
    options: [
      {
        label: t("sellers.status.pending"),
        value: "pending",
      },
      {
        label: t("sellers.status.active"),
        value: "active",
      },
      {
        label: t("sellers.status.suspended"),
        value: "suspended",
      },
    ],
  }

  const dateFilters: Filter[] = [
    { label: t("fields.createdAt"), key: "created_at" },
    { label: t("fields.updatedAt"), key: "updated_at" },
  ].map((f) => ({
    key: f.key,
    label: f.label,
    type: "date",
  }))

  return [statusFilter, ...dateFilters]
}
