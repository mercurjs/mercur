import { ArrowPath } from "@medusajs/icons"
import { toast } from "@medusajs/ui"
import { ActionMenu, DateCell, StatusCell, TextCell, TextHeader } from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useRetryPayout, useStripePayouts } from "../../../../hooks/api/stripe"
import { useActionBlocker } from "../../../../hooks/use-action-blocker"
import type { PayoutRow } from "../../../../lib/client"
import { PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL, formatAmount } from "../../../../lib/status"
import { EntityTable, useListParams } from "./entity-table"
import { JobCard } from "./job-card"

const columnHelper = createColumnHelper<PayoutRow>()

const reversedTotal = (row: PayoutRow) =>
  (row.reversals ?? [])
    .filter((reversal) => reversal.status === "paid")
    .reduce((sum, reversal) => sum + Number(reversal.amount ?? 0), 0)

export const usePayoutColumns = () => {
  const retry = useRetryPayout()
  const blocker = useActionBlocker("payouts", "edit")

  return useMemo(
    () => [
      columnHelper.accessor("created_at", {
        header: () => <TextHeader text="Created" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("order_id", {
        header: () => <TextHeader text="Order" />,
        cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} />,
      }),
      columnHelper.accessor((row) => row.seller?.name ?? "", {
        id: "seller",
        header: () => <TextHeader text="Seller" />,
        cell: ({ row }) => <TextCell text={row.original.seller?.name ?? "-"} />,
      }),
      columnHelper.accessor("amount", {
        header: () => <TextHeader text="Amount" />,
        cell: ({ row }) => <TextCell text={formatAmount(row.original.amount, row.original.currency_code)} />,
      }),
      columnHelper.accessor((row) => (row.reversals ?? []).length, {
        id: "reversals",
        header: () => <TextHeader text="Reversed" />,
        cell: ({ row }) => {
          const reversals = row.original.reversals ?? []
          if (!reversals.length) return <TextCell text="-" />
          const failed = reversals.some((reversal) => reversal.status === "failed")
          const text = `−${formatAmount(reversedTotal(row.original), row.original.currency_code)} (${reversals.length})`
          return failed ? <StatusCell color="red">{text}</StatusCell> : <TextCell text={text} />
        },
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) => (
          <StatusCell color={PAYOUT_STATUS_COLOR[getValue()] ?? "grey"}>{PAYOUT_STATUS_LABEL[getValue()] ?? getValue()}</StatusCell>
        ),
      }),
      columnHelper.accessor("status_reason", {
        header: () => <TextHeader text="Reason" />,
        cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} />,
      }),
      columnHelper.accessor("provider_payout_id", {
        header: () => <TextHeader text="Stripe id" />,
        cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Retry",
                    icon: <ArrowPath />,
                    onClick: () =>
                      retry.mutate(row.original.id, {
                        onSuccess: () => toast.success("Retried"),
                        onError: (e) => toast.error(e.message),
                      }),
                    disabled: blocker.disabled || !["failed", "on_hold", "pending"].includes(row.original.status),
                    disabledTooltip: blocker.disabledTooltip ?? "Only failed or held payouts can be retried",
                  },
                ],
              },
            ]}
          />
        ),
      }),
    ],
    [retry, blocker]
  )
}

export const PayoutsTab = () => {
  const { raw, offset, limit } = useListParams()
  const { data, isPending, isError, error } = useStripePayouts(
    { offset, limit, order: "-created_at" },
    { placeholderData: keepPreviousData }
  )
  const columns = usePayoutColumns()

  if (isError) throw error

  return (
    <div className="flex flex-col gap-y-3">
      <JobCard job="payout-process-transfers" />
      <JobCard job="payout-process-reversals" />
      <EntityTable
        title="Payouts"
        subtitle="Order totals minus commission, paid into each seller's connected account, with the refunds reversed from them."
        rows={(data?.payouts ?? []) as PayoutRow[]}
        count={data?.count ?? 0}
        columns={columns as never}
        isLoading={isPending}
        queryObject={raw}
        emptyTitle="No payouts yet"
        emptyMessage="Payouts appear within five minutes of an order being fulfilled and paid."
        testId="stripe-payouts-table"
      />
    </div>
  )
}
