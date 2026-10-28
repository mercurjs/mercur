import { PlaySolid } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import {
  ActionMenu,
  CodeCell,
  DateCell,
  SingleColumnPage,
  StatusCell,
  TextCell,
  TextHeader,
  WidgetZone,
  _DataTable,
  useDataTable,
} from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { useStripeJobs } from "../../../../hooks/api/stripe"
import type { AdminPayoutJob } from "../../../../lib/client"
import { JOB_LABEL, JOB_RUN_STATUS_COLOR, JOB_RUN_STATUS_LABEL, statusProps } from "../../../../lib/status"
import { SettingsProviders } from "../../../../providers/settings-providers"
import { useRunJobAction } from "./common/use-run-job-action"

const JobRowActions = ({ job }: { job: AdminPayoutJob }) => {
  const { handleRun } = useRunJobAction(job.job)

  return (
    <ActionMenu
      groups={[
        {
          actions: [{ label: "Run now", icon: <PlaySolid />, onClick: handleRun, permission: "payouts:edit" }],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<AdminPayoutJob>()

const useColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("job", {
        header: () => <TextHeader text="Job" />,
        cell: ({ getValue }) => <TextCell text={JOB_LABEL[getValue()] ?? getValue()} />,
      }),
      columnHelper.accessor("schedule", {
        header: () => <TextHeader text="Schedule (UTC)" />,
        cell: ({ getValue }) => <CodeCell code={getValue()} />,
      }),
      columnHelper.accessor((row) => row.last_run?.status ?? null, {
        id: "last_run",
        header: () => <TextHeader text="Last run" />,
        cell: ({ getValue }) => {
          if (!getValue()) {
            return <TextCell text="-" />
          }
          const { color, label } = statusProps(getValue(), JOB_RUN_STATUS_COLOR, JOB_RUN_STATUS_LABEL)
          return <StatusCell color={color}>{label}</StatusCell>
        },
      }),
      columnHelper.accessor((row) => row.last_run?.started_at ?? null, {
        id: "last_run_at",
        header: () => <TextHeader text="Last run at" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("next_run_at", {
        header: () => <TextHeader text="Next run" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("failed_count", {
        header: () => <TextHeader text="Failing items" />,
        cell: ({ getValue }) => <TextCell text={String(getValue())} />,
      }),
      columnHelper.accessor("enabled", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) =>
          getValue() ? <StatusCell color="green">Enabled</StatusCell> : <StatusCell color="grey">Disabled</StatusCell>,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <JobRowActions job={row.original} />,
      }),
    ],
    []
  )

const JobListDataTable = () => {
  const { jobs, isPending, isError, error } = useStripeJobs()
  const columns = useColumns()
  const count = jobs?.length ?? 0

  const { table } = useDataTable({
    data: jobs ?? [],
    columns,
    count,
    getRowId: (row) => row.job,
    pageSize: count || 1,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count}
      pageSize={count || 10}
      isLoading={isPending}
      navigateTo={(row) => `/finance/stripe/jobs/${row.original.job}`}
      noRecords={{ message: "No Stripe jobs are registered." }}
    />
  )
}

const JobListPage = () => (
  <SettingsProviders>
    <SingleColumnPage data-testid="stripe-job-list-page">
      <WidgetZone id="stripe.jobs.list">
        <Container className="divide-y p-0" data-testid="stripe-job-list-table">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Heading>Jobs</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                Scheduled jobs that sync accounts and move money through Stripe.
              </Text>
            </div>
          </div>
          <JobListDataTable />
        </Container>
      </WidgetZone>
    </SingleColumnPage>
  </SettingsProviders>
)

export const config = defineRouteConfig({
  label: "Jobs",
  nested: "/finance/stripe",
  rank: 30,
  permissions: ["payouts:view"],
})

export const handle = {
  breadcrumb: () => "Jobs",
  permissions: "payouts:view",
}

export default JobListPage
