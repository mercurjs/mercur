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
import { AdminSettlementListItem } from "../../api/settlements"
import {
  getSettlementPayoutStatusProps,
  getSettlementStatusProps,
} from "../../../pages/settlements/common/utils"

const columnHelper = createColumnHelper<AdminSettlementListItem>()

export const useSettlementTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: () => <TextHeader text={t("fields.id")} />,
        cell: ({ getValue }) => <TextCell text={`#${getValue()}`} />,
      }),
      columnHelper.display({
        id: "store",
        header: () => <TextHeader text={t("settlements.fields.store")} />,
        cell: ({ row }) => <TextCell text={row.original.seller?.name} />,
      }),
      columnHelper.accessor("period_start", {
        header: () => <TextHeader text={t("settlements.fields.periodStart")} />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("period_end", {
        header: () => <TextHeader text={t("settlements.fields.periodEnd")} />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
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
          const { color, label } = getSettlementStatusProps(getValue(), t)
          return <StatusCell color={color}>{label}</StatusCell>
        },
      }),
      columnHelper.display({
        id: "payout",
        header: () => <TextHeader text={t("settlements.fields.payout")} />,
        cell: ({ row }) => {
          const payout = row.original.payout
          if (!payout) {
            return <TextCell />
          }
          const { color, label } = getSettlementPayoutStatusProps(payout.status, t)
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
