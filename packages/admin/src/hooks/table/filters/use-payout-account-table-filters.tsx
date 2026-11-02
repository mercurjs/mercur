import { useTranslation } from "react-i18next"

import { Filter } from "../../../components/table/data-table"
import { useSellers } from "../../api/sellers"

export const usePayoutAccountTableFilters = () => {
  const { t } = useTranslation()

  const { sellers } = useSellers({ limit: 1000, fields: "id,name" })

  const statusFilter: Filter = {
    key: "status",
    label: t("fields.status"),
    type: "select",
    multiple: true,
    options: ["pending", "active", "restricted", "rejected"].map((value) => ({
      label: t(`payoutAccounts.status.${value}`),
      value,
    })),
  }

  const kycFilter: Filter = {
    key: "kyc_status",
    label: t("payoutAccounts.fields.kycStatus"),
    type: "select",
    multiple: true,
    options: [
      "pending_submission",
      "pending_approval",
      "approved",
      "refused",
    ].map((value) => ({
      label: t(`payoutAccounts.kycStatus.${value}`),
      value,
    })),
  }

  const sellerFilter: Filter[] = sellers?.length
    ? [
        {
          key: "seller_id",
          label: t("payoutAccounts.fields.store"),
          type: "select",
          multiple: true,
          options: sellers
            .filter((seller) => seller.name)
            .map((seller) => ({ label: seller.name, value: seller.id })),
        },
      ]
    : []

  const dateFilters: Filter[] = [
    { label: t("fields.createdAt"), key: "created_at" },
    { label: t("fields.updatedAt"), key: "updated_at" },
  ].map((f) => ({ key: f.key, label: f.label, type: "date" }))

  return [statusFilter, kycFilter, ...sellerFilter, ...dateFilters]
}
