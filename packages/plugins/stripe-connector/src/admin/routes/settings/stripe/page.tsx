import { Link as LinkIcon, PaperPlane } from "@medusajs/icons"
import { Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui"
import {
  ActionMenu,
  DateCell,
  JsonViewSection,
  SectionRow,
  SingleColumnPage,
  SingleColumnPageSkeleton,
  StatusCell,
  TextCell,
  TextHeader,
  WidgetZone,
  _DataTable,
  useDataTable,
  useDate,
} from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useSendTestNotification, useStripeNotifications, useStripeStatus } from "../../../hooks/api/stripe"
import { PAGE_SIZE, useStripeTableQuery } from "../../../hooks/use-stripe-table-query"
import type { AdminPayoutStatusResponse, NotificationRow } from "../../../lib/client"
import { StripeIcon } from "../../../components/stripe-icon"
import { SettingsProviders } from "../../../providers/settings-providers"

const PAYOUT_EVENTS = [
  "account.updated",
  "transfer.created",
  "transfer.reversed",
  "payout.paid",
  "payout.failed",
  "payout.canceled",
  "payout.updated",
]
const PAYMENT_EVENTS = [
  "payment_intent.succeeded",
  "payment_intent.amount_capturable_updated",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "charge.refunded",
]

type StripeOptions = { notifications?: { url?: string } }

type StripeGeneralSectionProps = {
  configured: boolean
  lastWebhookAt: AdminPayoutStatusResponse["last_webhook_at"]
  notificationUrl?: string
}

const StripeGeneralSection = ({ configured, lastWebhookAt, notificationUrl }: StripeGeneralSectionProps) => {
  const { getFullDate } = useDate()
  const { mutateAsync } = useSendTestNotification()

  const handleTest = async () => {
    await mutateAsync(undefined, {
      onSuccess: () => toast.success("Test notification sent"),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <Container className="divide-y p-0" data-testid="stripe-settings-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Stripe</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Card payments and payouts to stores through Stripe Connect.
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={configured ? "green" : "orange"}>
            {configured ? "Connected" : "Not configured"}
          </StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Map existing account",
                    icon: <LinkIcon />,
                    to: "map-account",
                    permission: "payouts:edit",
                  },
                  {
                    label: "Send test notification",
                    icon: <PaperPlane />,
                    onClick: handleTest,
                    permission: "payouts:edit",
                    disabled: !notificationUrl,
                    disabledTooltip: "Set notifications.url in the plugin options first",
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow
        title="API key"
        value={configured ? "Set in the plugin options" : "Missing from the plugin options"}
      />
      <SectionRow
        title="Last webhook"
        value={lastWebhookAt ? getFullDate({ date: lastWebhookAt, includeTime: true }) : "-"}
      />
    </Container>
  )
}

const StripeWebhooksSection = () => {
  const backend = import.meta.env.VITE_MERCUR_BACKEND_URL || "http://localhost:9000"

  return (
    <Container className="divide-y p-0" data-testid="stripe-settings-webhooks-section">
      <div className="px-6 py-4">
        <Heading level="h2">Webhooks</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Register both endpoints in the Stripe dashboard.
        </Text>
      </div>
      <SectionRow title="Connect endpoint" value={<code className="txt-compact-small select-all">{`${backend}/hooks/payout`}</code>} />
      <SectionRow title="Connect events" value={PAYOUT_EVENTS.join(", ")} />
      <SectionRow
        title="Payment endpoint"
        value={<code className="txt-compact-small select-all">{`${backend}/hooks/payment/pp_stripe-connector_stripe`}</code>}
      />
      <SectionRow title="Payment events" value={PAYMENT_EVENTS.join(", ")} />
    </Container>
  )
}

const columnHelper = createColumnHelper<NotificationRow>()

const useNotificationColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("created_at", {
        header: () => <TextHeader text="Sent" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("type", {
        header: () => <TextHeader text="Type" />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("attempts", {
        header: () => <TextHeader text="Attempts" />,
        cell: ({ getValue }) => <TextCell text={String(getValue())} />,
      }),
      columnHelper.accessor("delivered", {
        header: () => <TextHeader text="Status" />,
        cell: ({ row }) =>
          row.original.delivered ? (
            <StatusCell color="green">Delivered</StatusCell>
          ) : (
            <StatusCell color="red">Failed</StatusCell>
          ),
      }),
      columnHelper.accessor((row) => row.error ?? (row.response_status ? String(row.response_status) : ""), {
        id: "response",
        header: () => <TextHeader text="Response" />,
        cell: ({ getValue }) => <TextCell text={getValue() || "-"} />,
      }),
    ],
    []
  )

const StripeNotificationsSection = ({ url }: { url?: string }) => {
  const { searchParams, raw } = useStripeTableQuery()
  const { notifications, count, isPending, isError, error } = useStripeNotifications(searchParams, {
    placeholderData: keepPreviousData,
  })

  const columns = useNotificationColumns()

  const { table } = useDataTable({
    data: notifications ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0" data-testid="stripe-settings-notifications-section">
      <div className="px-6 py-4">
        <Heading level="h2">Notifications</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {url ? `Failed payouts, reversals and settlements are posted to ${url}.` : "No notification URL is set in the plugin options."}
        </Text>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count ?? 0}
        pageSize={PAGE_SIZE}
        isLoading={isPending}
        queryObject={raw}
        pagination
        noRecords={{ message: "A notification is sent when a payout, reversal or settlement fails." }}
      />
    </Container>
  )
}

const StripeSettings = () => {
  const { configured, options, last_webhook_at, isPending, isError, error } = useStripeStatus()

  if (isError) {
    throw error
  }

  if (isPending || !options) {
    return <SingleColumnPageSkeleton sections={3} />
  }

  const notificationUrl = (options as StripeOptions).notifications?.url

  return (
    <SingleColumnPage hasOutlet data-testid="stripe-settings-page">
      <WidgetZone id="stripe.settings" data={options}>
        <StripeGeneralSection
          configured={!!configured}
          lastWebhookAt={last_webhook_at ?? null}
          notificationUrl={notificationUrl}
        />
        <StripeWebhooksSection />
        <StripeNotificationsSection url={notificationUrl} />
        <JsonViewSection data={options} />
      </WidgetZone>
    </SingleColumnPage>
  )
}

const StripeSettingsPage = () => (
  <SettingsProviders>
    <StripeSettings />
  </SettingsProviders>
)

export const config = defineRouteConfig({
  label: "Stripe",
  icon: StripeIcon,
  group: "integrations",
  rank: 110,
  permissions: ["payouts:view"],
})

export const handle = { breadcrumb: () => "Stripe", permissions: "payouts:view" }

export default StripeSettingsPage
