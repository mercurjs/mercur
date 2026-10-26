import { StatusBadge } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { DateCell } from "../../../components/table/table-cells/common/date-cell"
import { TextCell } from "../../../components/table/table-cells/common/text-cell"
import { getStylizedAmount } from "../../../lib/money-amount-helpers"
import { PayoutDTO } from "@mercurjs/types"

type PayoutSeller = { id: string; name: string | null } | null

type PayoutRow = PayoutDTO & {
  seller?: PayoutSeller
  account?: { seller?: PayoutSeller } | null
}

const columnHelper = createColumnHelper<PayoutRow>()

const payoutStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "green"
    case "processing":
    case "on_hold":
      return "orange"
    case "pending":
      return "grey"
    case "aborted":
    case "failed":
    case "canceled":
      return "red"
    default:
      return "grey"
  }
}

export const usePayoutTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: t("fields.id"),
        cell: ({ getValue }) => `#${getValue()}`,
      }),
      columnHelper.display({
        id: "store",
        header: t("payoutAccounts.fields.store"),
        cell: ({ row }) => (
          <TextCell
            text={
              row.original.seller?.name ??
              row.original.account?.seller?.name ??
              undefined
            }
          />
        ),
      }),
      columnHelper.accessor("status", {
        header: t("fields.status"),
        cell: ({ getValue }) => {
          const status = getValue()
          const label = t(`payouts.status.${status}`, {
            defaultValue: status.charAt(0).toUpperCase() + status.slice(1),
          })
          return (
            <StatusBadge color={payoutStatusColor(status)}>
              {label}
            </StatusBadge>
          )
        },
      }),
      columnHelper.accessor("amount", {
        header: t("fields.amount"),
        cell: ({ getValue, row }) =>
          getStylizedAmount(getValue() as number, row.original.currency_code),
      }),
      columnHelper.accessor("created_at", {
        header: t("fields.createdAt"),
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
    ],
    [t],
  )
}
