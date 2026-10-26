import { useTranslation } from "react-i18next"

import { Filter } from "../../../components/table/data-table"
import {
  TRANSFER_STATUSES,
  TRANSFER_TYPES,
} from "../../../pages/transfers/common/utils"
import { usePayoutAccounts } from "../../api/payout-accounts"

export const useTransferTableFilters = ({
  excludeType = false,
}: { excludeType?: boolean } = {}) => {
  const { t } = useTranslation()

  const { payout_accounts } = usePayoutAccounts({ limit: 1000 })

  const statusFilter: Filter = {
    key: "status",
    label: t("fields.status"),
    type: "select",
    multiple: true,
    options: TRANSFER_STATUSES.map((value) => ({
      label: t(`transfers.status.${value}`),
      value,
    })),
  }

  const typeFilter: Filter = {
    key: "type",
    label: t("fields.type"),
    type: "select",
    multiple: true,
    options: TRANSFER_TYPES.filter((value) => value !== "refund_reversal").map((value) => ({
      label: t(`transfers.type.${value}`),
      value,
    })),
  }

  const accounts = (payout_accounts ?? []).filter((account) => account.seller?.name)

  const storeFilter: Filter[] = accounts.length
    ? [
        {
          key: "account_id",
          label: t("transfers.fields.store"),
          type: "select",
          multiple: true,
          options: accounts.map((account) => ({
            label: account.seller!.name,
            value: account.id,
          })),
        },
      ]
    : []

  const dateFilters: Filter[] = [
    { label: t("fields.createdAt"), key: "created_at" },
    { label: t("fields.updatedAt"), key: "updated_at" },
  ].map((f) => ({ key: f.key, label: f.label, type: "date" }))

  return [
    statusFilter,
    ...(excludeType ? [] : [typeFilter]),
    ...storeFilter,
    ...dateFilters,
  ]
}
