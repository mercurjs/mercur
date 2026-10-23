import { ArrowPath, OpenRectArrowOut } from "@medusajs/icons"
import { ActionMenu, DateCell, StatusCell, TextCell, TextHeader } from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useAccountAction, useStripeAccounts } from "../../../../hooks/api/stripe"
import { useActionBlocker } from "../../../../hooks/use-action-blocker"
import type { PayoutAccountRow } from "../../../../lib/client"
import { KYC_STATUS_COLOR, KYC_STATUS_LABEL } from "../../../../lib/status"
import { EntityTable, useListParams } from "./entity-table"
import { JobCard } from "./job-card"

const columnHelper = createColumnHelper<PayoutAccountRow>()

export const KycTab = () => {
  const { raw, offset, limit } = useListParams()
  const { data, isPending, isError, error } = useStripeAccounts(
    { offset, limit, kyc_status: ["pending_submission", "pending_approval", "refused"] },
    { placeholderData: keepPreviousData }
  )
  const action = useAccountAction()
  const blocker = useActionBlocker("payouts", "edit")

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.seller?.name ?? "", {
        id: "seller",
        header: () => <TextHeader text="Seller" />,
        cell: ({ row }) => <TextCell text={row.original.seller?.name ?? "-"} />,
      }),
      columnHelper.accessor("kyc_status", {
        header: () => <TextHeader text="KYC" />,
        cell: ({ getValue }) => <StatusCell color={KYC_STATUS_COLOR[getValue() as string] ?? "grey"}>{KYC_STATUS_LABEL[getValue() as string] ?? "-"}</StatusCell>,
      }),
      columnHelper.accessor((row) => (row.requirements?.currently_due ?? []).join(", "), {
        id: "currently_due",
        header: () => <TextHeader text="Currently due" />,
        cell: ({ getValue }) => <TextCell text={getValue() || "-"} />,
      }),
      columnHelper.accessor((row) => (row.requirements?.past_due ?? []).join(", "), {
        id: "past_due",
        header: () => <TextHeader text="Past due" />,
        cell: ({ getValue }) => <TextCell text={getValue() || "-"} />,
      }),
      columnHelper.accessor((row) => (row.requirements?.pending_verification ?? []).join(", "), {
        id: "pending_verification",
        header: () => <TextHeader text="Pending verification" />,
        cell: ({ getValue }) => <TextCell text={getValue() || "-"} />,
      }),
      columnHelper.accessor("disabled_reason", {
        header: () => <TextHeader text="Disabled reason" />,
        cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} />,
      }),
      columnHelper.accessor("last_synced_at", {
        header: () => <TextHeader text="Synced" />,
        cell: ({ getValue }) => <DateCell date={getValue() ?? null} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <ActionMenu
            groups={[
              {
                actions: [
                  { label: "Sync from Stripe", icon: <ArrowPath />, onClick: () => action.mutate({ id: row.original.id, action: "sync" }), ...blocker },
                  ...(row.original.provider_account_id
                    ? [{ label: "Open in Stripe", icon: <OpenRectArrowOut />, onClick: () => window.open(`https://dashboard.stripe.com/connect/accounts/${row.original.provider_account_id}`, "_blank") }]
                    : []),
                ],
              },
            ]}
          />
        ),
      }),
    ],
    [action, blocker]
  )

  if (isError) throw error

  return (
    <div className="flex flex-col gap-y-3">
      <JobCard job="payout-monitor-kyc" />
      <EntityTable
        title="Accounts needing attention"
        subtitle="Connected accounts whose Stripe requirements are outstanding, under review or refused."
        rows={(data?.payout_accounts ?? []) as PayoutAccountRow[]}
        count={data?.count ?? 0}
        columns={columns as never}
        isLoading={isPending}
        queryObject={raw}
        emptyTitle="Every account is approved"
        emptyMessage="Accounts show up here when Stripe asks the seller for more information."
        testId="stripe-kyc-table"
      />
    </div>
  )
}
