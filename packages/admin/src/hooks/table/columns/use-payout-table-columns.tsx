import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { DateCell } from "../../../components/table/table-cells/common/date-cell"
import { MoneyAmountCell } from "../../../components/table/table-cells/common/money-amount-cell"
import { StatusCell } from "../../../components/table/table-cells/common/status-cell"
import {
  TextCell,
  TextHeader,
} from "../../../components/table/table-cells/common/text-cell"
import { getPayoutStatusProps } from "../../../pages/payouts/common/utils"
import { AdminPayout } from "../../api/payouts"

const columnHelper = createColumnHelper<AdminPayout>()

export const usePayoutTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => <TextHeader text={t("fields.id")} />,
        cell: ({ getValue }) => <TextCell text={`#${getValue()}`} />,
      }),
      columnHelper.display({
        id: "store",
        header: () => <TextHeader text={t("payoutAccounts.fields.store")} />,
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
      columnHelper.accessor("order_id", {
        header: () => <TextHeader text={t("payouts.fields.order")} />,
        cell: ({ getValue, row }) => (
          <TextCell
            text={
              row.original.order?.display_id
                ? `#${row.original.order.display_id}`
                : getValue() ?? undefined
            }
          />
        ),
      }),
      columnHelper.accessor("amount", {
        header: () => <TextHeader text={t("fields.amount")} />,
        cell: ({ getValue, row }) => (
          <MoneyAmountCell
            amount={Number(getValue())}
            currencyCode={row.original.currency_code}
          />
        ),
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text={t("fields.status")} />,
        cell: ({ getValue }) => {
          const { color, label } = getPayoutStatusProps(getValue(), t)
          return <StatusCell color={color}>{label}</StatusCell>
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => <TextHeader text={t("fields.createdAt")} />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
    ],
    [t],
  )
}
