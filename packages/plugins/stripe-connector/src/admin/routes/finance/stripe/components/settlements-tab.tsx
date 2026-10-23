import { ArrowPath } from "@medusajs/icons"
import { Button, Drawer, Input, Label, Select, Textarea, toast } from "@medusajs/ui"
import { ActionMenu, DateCell, StatusCell, TextCell, TextHeader } from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"

import {
  useCreateAdjustment,
  useRetryPayout,
  useStripeAdjustments,
  useStripeSettlements,
} from "../../../../hooks/api/stripe"
import { useActionBlocker } from "../../../../hooks/use-action-blocker"
import type { AdjustmentRow, SettlementRow } from "../../../../lib/client"
import {
  PAYOUT_STATUS_COLOR,
  PAYOUT_STATUS_LABEL,
  SETTLEMENT_STATUS_COLOR,
  SETTLEMENT_STATUS_LABEL,
  formatAmount,
} from "../../../../lib/status"
import { EntityTable, useListParams } from "./entity-table"
import { JobCard } from "./job-card"

const settlementHelper = createColumnHelper<SettlementRow>()
const adjustmentHelper = createColumnHelper<AdjustmentRow>()

const AddAdjustmentDrawer = () => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ seller_id: "", type: "subscription", amount: "", currency_code: "", reason: "" })
  const mutation = useCreateAdjustment()
  const blocker = useActionBlocker("payouts", "edit")

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button size="small" variant="secondary" disabled={blocker.disabled} data-testid="stripe-add-adjustment">
          Add adjustment
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Add an adjustment</Drawer.Title>
          <Drawer.Description>
            A subscription fee or extra invoice debits the seller on the next settlement; a credit pays them.
          </Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="adj-seller">Seller id</Label>
            <Input id="adj-seller" value={form.seller_id} onChange={(e) => setForm({ ...form, seller_id: e.target.value })} />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="adj-type">Type</Label>
            <Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}>
              <Select.Trigger id="adj-type">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="subscription">Subscription (debit)</Select.Item>
                <Select.Item value="extra_invoice">Extra invoice (debit)</Select.Item>
                <Select.Item value="extra_credit">Extra credit (credit)</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="adj-amount">Amount</Label>
              <Input id="adj-amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="adj-currency">Currency</Label>
              <Input id="adj-currency" placeholder="eur" value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="adj-reason">Reason</Label>
            <Textarea id="adj-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button size="small" variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button
            size="small"
            isLoading={mutation.isPending}
            onClick={() =>
              mutation.mutate(
                { seller_id: form.seller_id, type: form.type, amount: Number(form.amount), currency_code: form.currency_code, reason: form.reason || null },
                {
                  onSuccess: () => {
                    toast.success("Adjustment added", { description: "It becomes a transfer on the next settlement run." })
                    setOpen(false)
                  },
                  onError: (e) => toast.error(e.message),
                }
              )
            }
          >
            Add
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

export const SettlementsTab = () => {
  const { raw, offset, limit } = useListParams()
  const settlements = useStripeSettlements({ offset, limit }, { placeholderData: keepPreviousData })
  const adjustments = useStripeAdjustments({ limit: 20, offset: 0 })
  const retry = useRetryPayout()
  const blocker = useActionBlocker("payouts", "edit")

  const settlementColumns = useMemo(
    () => [
      settlementHelper.accessor("period_end", {
        header: () => <TextHeader text="Period" />,
        cell: ({ row }) => <TextCell text={`${new Date(row.original.period_start).toLocaleDateString()} → ${new Date(row.original.period_end).toLocaleString()}`} />,
      }),
      settlementHelper.accessor((row) => row.seller?.name ?? "", {
        id: "seller",
        header: () => <TextHeader text="Seller" />,
        cell: ({ row }) => <TextCell text={row.original.seller?.name ?? "-"} />,
      }),
      settlementHelper.accessor("transfers_total", {
        header: () => <TextHeader text="Transfers" />,
        cell: ({ row }) => <TextCell text={`${formatAmount(row.original.transfers_total, row.original.currency_code)} (${row.original.transfer_count})`} />,
      }),
      settlementHelper.accessor("reversals_total", {
        header: () => <TextHeader text="Reversals" />,
        cell: ({ row }) => <TextCell text={`−${formatAmount(row.original.reversals_total, row.original.currency_code)} (${row.original.reversal_count})`} />,
      }),
      settlementHelper.accessor("adjustments_total", {
        header: () => <TextHeader text="Adjustments" />,
        cell: ({ row }) => <TextCell text={`${formatAmount(row.original.adjustments_total, row.original.currency_code)} (${row.original.adjustment_count})`} />,
      }),
      settlementHelper.accessor("amount", {
        header: () => <TextHeader text="Amount" />,
        cell: ({ row }) => <TextCell text={formatAmount(row.original.amount, row.original.currency_code)} />,
      }),
      settlementHelper.accessor("status", {
        header: () => <TextHeader text="Settlement" />,
        cell: ({ getValue }) => <StatusCell color={SETTLEMENT_STATUS_COLOR[getValue()] ?? "grey"}>{SETTLEMENT_STATUS_LABEL[getValue()] ?? getValue()}</StatusCell>,
      }),
      settlementHelper.accessor((row) => row.payout?.status ?? "", {
        id: "payout",
        header: () => <TextHeader text="Payout" />,
        cell: ({ row }) => {
          const payout = row.original.payout
          if (!payout) return <TextCell text="-" />
          return (
            <StatusCell color={PAYOUT_STATUS_COLOR[payout.status] ?? "grey"}>
              {PAYOUT_STATUS_LABEL[payout.status] ?? payout.status}
              {payout.status_reason ? ` · ${payout.status_reason}` : ""}
            </StatusCell>
          )
        },
      }),
      settlementHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const payout = row.original.payout
          return (
            <ActionMenu
              groups={[
                {
                  actions: [
                    {
                      label: "Retry payout",
                      icon: <ArrowPath />,
                      onClick: () =>
                        payout &&
                        retry.mutate(payout.id, {
                          onSuccess: () => toast.success("Retried"),
                          onError: (e) => toast.error(e.message),
                        }),
                      disabled: blocker.disabled || !payout || !["failed", "on_hold", "pending"].includes(payout.status),
                      disabledTooltip: blocker.disabledTooltip ?? "Only failed or held payouts can be retried",
                    },
                  ],
                },
              ]}
            />
          )
        },
      }),
    ],
    [retry, blocker]
  )

  const adjustmentColumns = useMemo(
    () => [
      adjustmentHelper.accessor("created_at", { header: () => <TextHeader text="Created" />, cell: ({ getValue }) => <DateCell date={getValue()} /> }),
      adjustmentHelper.accessor("account_id", { header: () => <TextHeader text="Account" />, cell: ({ getValue }) => <TextCell text={getValue()} /> }),
      adjustmentHelper.accessor("type", { header: () => <TextHeader text="Type" />, cell: ({ getValue }) => <TextCell text={getValue()} /> }),
      adjustmentHelper.accessor("amount", {
        header: () => <TextHeader text="Amount" />,
        cell: ({ row }) => <TextCell text={formatAmount(row.original.amount, row.original.currency_code)} />,
      }),
      adjustmentHelper.accessor("reason", { header: () => <TextHeader text="Reason" />, cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} /> }),
      adjustmentHelper.accessor("transfer_id", {
        header: () => <TextHeader text="Transfer" />,
        cell: ({ getValue }) => (getValue() ? <TextCell text={getValue() as string} /> : <StatusCell color="blue">Next run</StatusCell>),
      }),
    ],
    []
  )

  if (settlements.isError) throw settlements.error

  return (
    <div className="flex flex-col gap-y-3">
      <JobCard job="payout-process-settlements" />
      <EntityTable
        title="Settlements"
        subtitle="What each seller was owed per window, and the payout that paid it."
        rows={(settlements.data?.settlements ?? []) as SettlementRow[]}
        count={settlements.data?.count ?? 0}
        columns={settlementColumns as never}
        isLoading={settlements.isPending}
        queryObject={raw}
        emptyTitle="No settlements yet"
        emptyMessage="Settlements are built every night at 01:03 UTC from the transfers that landed."
        testId="stripe-settlements-table"
        navigateTo={(id) => `/finance/stripe/settlements/${id}`}
      />
      <EntityTable
        title="Adjustments"
        subtitle="Subscription fees, extra invoices and credits entered by the operator."
        rows={(adjustments.data?.adjustments ?? []) as AdjustmentRow[]}
        count={adjustments.data?.count ?? 0}
        columns={adjustmentColumns as never}
        isLoading={adjustments.isPending}
        queryObject={{}}
        actions={<AddAdjustmentDrawer />}
        emptyTitle="No adjustments"
        emptyMessage="Add one to debit or credit a seller outside of orders."
        testId="stripe-adjustments-table"
      />
    </div>
  )
}
