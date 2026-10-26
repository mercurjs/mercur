import { useTranslation } from "react-i18next"

import { Filter } from "../../../components/table/data-table"
import { SETTLEMENT_STATUSES } from "../../../pages/settlements/common/utils"
import { usePayoutAccounts } from "../../api/payout-accounts"

export const useSettlementTableFilters = () => {
  const { t } = useTranslation()

  const { payout_accounts } = usePayoutAccounts({ limit: 1000 })

  const statusFilter: Filter = {
    key: "status",
    label: t("fields.status"),
    type: "select",
    multiple: true,
    options: SETTLEMENT_STATUSES.map((value) => ({
      label: t(`settlements.status.${value}`),
      value,
    })),
  }

  const accounts = (payout_accounts ?? []).filter((account) => account.seller?.name)

  const storeFilter: Filter[] = accounts.length
    ? [
        {
          key: "account_id",
          label: t("settlements.fields.store"),
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
    { label: t("settlements.fields.periodStart"), key: "period_start" },
    { label: t("settlements.fields.periodEnd"), key: "period_end" },
  ].map((f) => ({ key: f.key, label: f.label, type: "date" }))

  return [statusFilter, ...storeFilter, ...dateFilters]
}
