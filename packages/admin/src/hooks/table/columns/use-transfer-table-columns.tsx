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
import { AdminTransfer } from "../../api/transfers"
import {
  getTransferStatusProps,
  getTransferTypeLabel,
} from "../../../pages/transfers/common/utils"

const columnHelper = createColumnHelper<AdminTransfer>()

export const useTransferTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.display({
        id: "store",
        header: () => <TextHeader text={t("transfers.fields.store")} />,
        cell: ({ row }) => (
          <TextCell text={row.original.account?.seller?.name} />
        ),
      }),
      columnHelper.accessor("type", {
        header: () => <TextHeader text={t("fields.type")} />,
        cell: ({ getValue }) => (
          <TextCell text={getTransferTypeLabel(getValue(), t)} />
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
          const { color, label } = getTransferStatusProps(getValue(), t)
          return <StatusCell color={color}>{label}</StatusCell>
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => <TextHeader text={t("fields.createdAt")} />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("updated_at", {
        header: () => <TextHeader text={t("fields.updatedAt")} />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
    ],
    [t],
  )
}
