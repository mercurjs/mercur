import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { PayoutDTO } from "@mercurjs/types"
import { StatusBadge, Text } from "@medusajs/ui"
import {
  DateCell,
  DateHeader,
} from "../../../components/table/table-cells/common/date-cell"
import { getStylizedAmount } from "../../../lib/money-amount-helpers"

const columnHelper = createColumnHelper<PayoutDTO>()

const payoutStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "green"
    case "processing":
      return "orange"
    case "pending":
      return "grey"
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
      columnHelper.accessor("id", {
        header: () => (
          <Text size="small" leading="compact" weight="plus">
            {t("fields.id")}
          </Text>
        ),
        cell: ({ getValue }) => {
          const id = getValue()
          return (
            <Text size="small" leading="compact">
              {id.replace("payout_", "").slice(0, 8)}
            </Text>
          )
        },
      }),
      columnHelper.accessor("status", {
        header: () => (
          <Text size="small" leading="compact" weight="plus">
            {t("fields.status")}
          </Text>
        ),
        cell: ({ getValue }) => {
          const status = getValue()
          return (
            <StatusBadge color={payoutStatusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </StatusBadge>
          )
        },
      }),
      columnHelper.accessor("amount", {
        header: () => (
          <Text size="small" leading="compact" weight="plus">
            {t("fields.amount")}
          </Text>
        ),
        cell: ({ getValue, row }) => {
          const amount = getValue() as number
          const currencyCode = row.original.currency_code
          return (
            <Text size="small" leading="compact">
              {getStylizedAmount(amount, currencyCode)}
            </Text>
          )
        },
      }),
      columnHelper.accessor("currency_code", {
        header: () => (
          <Text size="small" leading="compact" weight="plus">
            {t("fields.currency")}
          </Text>
        ),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact">
            {getValue().toUpperCase()}
          </Text>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: () => <DateHeader />,
        cell: ({ getValue }) => {
          const date = new Date(getValue())
          return <DateCell date={date} />
        },
      }),
    ],
    [t]
  )
}
