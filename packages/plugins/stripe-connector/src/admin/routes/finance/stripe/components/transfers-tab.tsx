import { ArrowPath } from "@medusajs/icons"
import { toast } from "@medusajs/ui"
import { ActionMenu, DateCell, StatusCell, TextCell, TextHeader } from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useRetryTransfer, useStripeTransfers } from "../../../../hooks/api/stripe"
import { useActionBlocker } from "../../../../hooks/use-action-blocker"
import type { TransferRow } from "../../../../lib/client"
import { TRANSFER_STATUS_COLOR, TRANSFER_STATUS_LABEL, formatAmount } from "../../../../lib/status"
import { EntityTable, useListParams } from "./entity-table"
import { JobCard } from "./job-card"

const columnHelper = createColumnHelper<TransferRow>()

export const useTransferColumns = (reversal: boolean) => {
  const retry = useRetryTransfer()
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
      ...(reversal
        ? [
            columnHelper.accessor("refund_id", {
              header: () => <TextHeader text="Refund" />,
              cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} />,
            }),
          ]
        : [
            columnHelper.accessor("type", {
              header: () => <TextHeader text="Type" />,
              cell: ({ getValue }) => <TextCell text={getValue()} />,
            }),
          ]),
      columnHelper.accessor((row) => row.account?.seller?.name ?? "", {
        id: "seller",
        header: () => <TextHeader text="Seller" />,
        cell: ({ row }) => <TextCell text={row.original.account?.seller?.name ?? "-"} />,
      }),
      columnHelper.accessor("amount", {
        header: () => <TextHeader text="Amount" />,
        cell: ({ row }) => <TextCell text={formatAmount(row.original.amount, row.original.currency_code)} />,
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) => <StatusCell color={TRANSFER_STATUS_COLOR[getValue()] ?? "grey"}>{TRANSFER_STATUS_LABEL[getValue()] ?? getValue()}</StatusCell>,
      }),
      columnHelper.accessor("status_reason", {
        header: () => <TextHeader text="Reason" />,
        cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} />,
      }),
      columnHelper.accessor("provider_transfer_id", {
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
                    disabledTooltip: blocker.disabledTooltip ?? "Only failed or held transfers can be retried",
                  },
                ],
              },
            ]}
          />
        ),
      }),
    ],
    [retry, blocker, reversal]
  )
}

export const TransfersTab = ({ reversal = false }: { reversal?: boolean }) => {
  const { raw, offset, limit } = useListParams()
  const { data, isPending, isError, error } = useStripeTransfers(
    { offset, limit, type: reversal ? "refund_reversal" : ["order", "tax", "adjustment_credit", "adjustment_debit"], order: "-created_at" },
    { placeholderData: keepPreviousData }
  )
  const columns = useTransferColumns(reversal)

  if (isError) throw error

  return (
    <div className="flex flex-col gap-y-3">
      <JobCard job={reversal ? "payout-process-reversals" : "payout-process-transfers"} />
      <EntityTable
        title={reversal ? "Reversals" : "Transfers"}
        subtitle={
          reversal
            ? "The seller's share of every refund, reversed on the original transfer."
            : "Order totals minus commission, moved to each seller's connected account."
        }
        rows={(data?.transfers ?? []) as TransferRow[]}
        count={data?.count ?? 0}
        columns={columns as never}
        isLoading={isPending}
        queryObject={raw}
        emptyTitle={reversal ? "No reversals yet" : "No transfers yet"}
        emptyMessage={
          reversal
            ? "Reversals appear within five minutes of a refund on a paid-out order."
            : "Transfers appear within five minutes of an order being fulfilled and paid."
        }
        testId={reversal ? "stripe-reversals-table" : "stripe-transfers-table"}
      />
    </div>
  )
}
