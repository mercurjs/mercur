import { ArrowPath, Link as LinkIcon, OpenRectArrowOut, XMark } from "@medusajs/icons"
import { Button, Drawer, Input, Label, StatusBadge, toast } from "@medusajs/ui"
import { ActionMenu, DateCell, StatusCell, TextCell, TextHeader } from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"

import { useAccountAction, useMapAccount, useStripeAccounts } from "../../../../hooks/api/stripe"
import { useActionBlocker } from "../../../../hooks/use-action-blocker"
import type { PayoutAccountRow } from "../../../../lib/client"
import { ACCOUNT_STATUS_COLOR, KYC_STATUS_COLOR, KYC_STATUS_LABEL } from "../../../../lib/status"
import { EntityTable, useListParams } from "./entity-table"
import { JobCard } from "./job-card"

const columnHelper = createColumnHelper<PayoutAccountRow>()

const MapAccountDrawer = () => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ seller_id: "", provider_id: "pop_stripe-connect_stripe", provider_account_id: "" })
  const mutation = useMapAccount()
  const blocker = useActionBlocker("payouts", "edit")

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button size="small" variant="secondary" disabled={blocker.disabled} data-testid="stripe-map-account">
          Map existing account
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Map an existing Stripe account</Drawer.Title>
          <Drawer.Description>Attach a connected account that already exists in Stripe to a seller.</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4">
          {(["seller_id", "provider_id", "provider_account_id"] as const).map((key) => (
            <div key={key} className="flex flex-col gap-y-2">
              <Label htmlFor={`map-${key}`}>{key.replace(/_/g, " ")}</Label>
              <Input
                id={`map-${key}`}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                data-testid={`stripe-map-${key}`}
              />
            </div>
          ))}
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button size="small" variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button
            size="small"
            isLoading={mutation.isPending}
            onClick={() =>
              mutation.mutate(form, {
                onSuccess: () => {
                  toast.success("Account mapped")
                  setOpen(false)
                },
                onError: (error) => toast.error(error.message),
              })
            }
          >
            Map account
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

export const AccountsTab = () => {
  const { raw, offset, limit } = useListParams()
  const { data, isPending, isError, error } = useStripeAccounts({ offset, limit }, { placeholderData: keepPreviousData })
  const action = useAccountAction()
  const blocker = useActionBlocker("payouts", "edit")

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.seller?.name ?? "", {
        id: "seller",
        header: () => <TextHeader text="Seller" />,
        cell: ({ row }) => <TextCell text={row.original.seller?.name ?? "-"} />,
      }),
      columnHelper.accessor("provider_account_id", {
        header: () => <TextHeader text="Stripe account" />,
        cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} />,
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) => <StatusCell color={ACCOUNT_STATUS_COLOR[getValue()] ?? "grey"}>{getValue()}</StatusCell>,
      }),
      columnHelper.accessor("kyc_status", {
        header: () => <TextHeader text="KYC" />,
        cell: ({ getValue }) =>
          getValue() ? (
            <StatusCell color={KYC_STATUS_COLOR[getValue() as string] ?? "grey"}>{KYC_STATUS_LABEL[getValue() as string]}</StatusCell>
          ) : (
            <TextCell text="-" />
          ),
      }),
      columnHelper.accessor("payouts_enabled", {
        header: () => <TextHeader text="Payouts" />,
        cell: ({ getValue }) => (getValue() ? <StatusBadge color="green">Enabled</StatusBadge> : <StatusBadge color="orange">Disabled</StatusBadge>),
      }),
      columnHelper.accessor("disabled_reason", {
        header: () => <TextHeader text="Reason" />,
        cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} />,
      }),
      columnHelper.accessor("ignored", {
        header: () => <TextHeader text="Ignored" />,
        cell: ({ getValue }) => <TextCell text={getValue() ? "Yes" : "No"} />,
      }),
      columnHelper.accessor("last_synced_at", {
        header: () => <TextHeader text="Synced" />,
        cell: ({ getValue }) => <DateCell date={getValue() ?? null} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const account = row.original
          const url = (account.onboarding?.data?.url as string | undefined) ?? null
          return (
            <ActionMenu
              groups={[
                {
                  actions: [
                    { label: "Sync from Stripe", icon: <ArrowPath />, onClick: () => action.mutate({ id: account.id, action: "sync" }), ...blocker },
                    { label: "Refresh link", icon: <LinkIcon />, onClick: () => action.mutate({ id: account.id, action: "refresh-link" }), ...blocker },
                    ...(url ? [{ label: "Open link", icon: <OpenRectArrowOut />, onClick: () => window.open(url, "_blank") }] : []),
                  ],
                },
                {
                  actions: [
                    {
                      label: account.ignored ? "Stop ignoring" : "Ignore seller",
                      icon: <XMark />,
                      onClick: () => action.mutate({ id: account.id, action: "ignore", ignored: !account.ignored }),
                      ...blocker,
                    },
                  ],
                },
              ]}
            />
          )
        },
      }),
    ],
    [action, blocker]
  )

  if (isError) throw error

  return (
    <div className="flex flex-col gap-y-3">
      <JobCard job="payout-sync-onboarding" />
      <EntityTable
        title="Accounts"
        subtitle="Every seller's connected account, mirrored from Stripe."
        rows={(data?.payout_accounts ?? []) as PayoutAccountRow[]}
        count={data?.count ?? 0}
        columns={columns as never}
        isLoading={isPending}
        queryObject={raw}
        actions={<MapAccountDrawer />}
        emptyTitle="No accounts yet"
        emptyMessage="Accounts appear within a minute of a seller registering."
        testId="stripe-accounts-table"
      />
    </div>
  )
}
