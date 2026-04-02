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
        label: t("stores.status.open"),
        value: "open",
      },
      {
        label: t("stores.status.pendingApproval"),
        value: "pending_approval",
      },
      {
        label: t("stores.status.suspended"),
        value: "suspended",
      },
      {
        label: t("stores.status.terminated"),
        value: "terminated",
      },
    ],
  }

  const premiumFilter: Filter = {
    key: "is_premium",
    label: t("stores.fields.premium"),
    type: "select",
    options: [
      {
        label: t("stores.premium.yes"),
        value: "true",
      },
      {
        label: t("stores.premium.no"),
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
    type: "date",
  }))

  return [statusFilter, premiumFilter, ...dateFilters]
}
