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
import { AdminPayoutCapture } from "../../api/payout-captures"
import {
  getPayoutCaptureActionProps,
  toNumber,
} from "../../../pages/payout-captures/common/utils"

const columnHelper = createColumnHelper<AdminPayoutCapture>()

export const usePayoutCaptureTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("order_group_display_id", {
        header: () => (
          <TextHeader text={t("payoutCaptures.fields.orderGroup")} />
        ),
        cell: ({ row }) => (
          <TextCell
            text={
              row.original.order_group_display_id
                ? `#${row.original.order_group_display_id}`
                : row.original.order_group_id
            }
          />
        ),
      }),
      columnHelper.accessor("action", {
        header: () => <TextHeader text={t("fields.status")} />,
        cell: ({ getValue }) => {
          const { color, label } = getPayoutCaptureActionProps(getValue(), t)
          return <StatusCell color={color}>{label}</StatusCell>
        },
      }),
      columnHelper.accessor("authorized_amount", {
        header: () => (
          <TextHeader text={t("payoutCaptures.fields.authorizedAmount")} />
        ),
        cell: ({ row }) => (
          <MoneyAmountCell
            amount={toNumber(row.original.authorized_amount)}
            currencyCode={row.original.currency_code}
          />
        ),
      }),
      columnHelper.accessor("capturable_amount", {
        header: () => (
          <TextHeader text={t("payoutCaptures.fields.capturableAmount")} />
        ),
        cell: ({ row }) => (
          <MoneyAmountCell
            amount={toNumber(row.original.capturable_amount)}
            currencyCode={row.original.currency_code}
          />
        ),
      }),
      columnHelper.accessor("orders_decided", {
        header: () => (
          <TextHeader text={t("payoutCaptures.fields.ordersDecided")} />
        ),
        cell: ({ row }) => (
          <TextCell
            text={`${row.original.orders_decided} / ${row.original.orders_total}`}
          />
        ),
      }),
      columnHelper.accessor("expires_at", {
        header: () => <TextHeader text={t("payoutCaptures.fields.expiresAt")} />,
        cell: ({ getValue }) => <DateCell date={getValue() ?? null} />,
      }),
    ],
    [t],
  )
}
