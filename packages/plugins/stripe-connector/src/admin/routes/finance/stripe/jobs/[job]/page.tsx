import { PlaySolid } from "@medusajs/icons"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import {
  ActionMenu,
  DateCell,
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
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useParams, type UIMatch } from "react-router-dom"

import { useStripeJobRuns, useStripeJobs } from "../../../../../hooks/api/stripe"
import { PAGE_SIZE, useStripeTableQuery } from "../../../../../hooks/use-stripe-table-query"
import type { AdminPayoutJob, JobRunRow } from "../../../../../lib/client"
import {
  JOB_DESCRIPTION,
  JOB_LABEL,
  JOB_RUN_STATUS_COLOR,
  JOB_RUN_STATUS_LABEL,
  JOB_TRIGGER_LABEL,
  statusProps,
} from "../../../../../lib/status"
import { SettingsProviders } from "../../../../../providers/settings-providers"
import { useRunJobAction } from "../common/use-run-job-action"

const JobGeneralSection = ({ job }: { job: AdminPayoutJob }) => {
  const { getFullDate } = useDate()
  const { handleRun } = useRunJobAction(job.job)

  const formatDate = (value: Date | string | null | undefined) =>
    value ? getFullDate({ date: value, includeTime: true }) : "-"

  return (
    <Container className="divide-y p-0" data-testid="stripe-job-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{JOB_LABEL[job.job] ?? job.job}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {JOB_DESCRIPTION[job.job]}
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={job.enabled ? "green" : "grey"}>{job.enabled ? "Enabled" : "Disabled"}</StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [{ label: "Run now", icon: <PlaySolid />, onClick: handleRun, permission: "payouts:edit" }],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow title="Job" value={job.job} />
      <SectionRow title="Schedule (UTC)" value={job.schedule} />
      <SectionRow title="Checkpoint" value={formatDate(job.checkpoint)} />
      <SectionRow title="Next run" value={formatDate(job.next_run_at)} />
      <SectionRow title="Failing items" value={String(job.failed_count)} />
    </Container>
  )
}

const columnHelper = createColumnHelper<JobRunRow>()

const formatStats = (stats: Record<string, unknown> | null) =>
  stats
    ? Object.entries(stats)
        .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
        .join(", ")
    : "-"

const useRunColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("started_at", {
        header: () => <TextHeader text="Started" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) => {
          const { color, label } = statusProps(getValue(), JOB_RUN_STATUS_COLOR, JOB_RUN_STATUS_LABEL)
          return <StatusCell color={color}>{label}</StatusCell>
        },
      }),
      columnHelper.accessor("trigger", {
        header: () => <TextHeader text="Trigger" />,
        cell: ({ getValue }) => <TextCell text={JOB_TRIGGER_LABEL[getValue()] ?? getValue()} />,
      }),
      columnHelper.accessor("finished_at", {
        header: () => <TextHeader text="Duration" />,
        cell: ({ row }) => {
          const { started_at, finished_at } = row.original
          if (!finished_at) {
            return <TextCell text="-" />
          }
          const seconds = (new Date(finished_at).getTime() - new Date(started_at).getTime()) / 1000
          return <TextCell text={`${seconds.toFixed(1)}s`} />
        },
      }),
      columnHelper.accessor((row) => row.error ?? formatStats(row.stats), {
        id: "result",
        header: () => <TextHeader text="Result" />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
    ],
    []
  )

const JobRunsSection = ({ job }: { job: string }) => {
  const { searchParams, raw } = useStripeTableQuery()
  const { runs, count, isPending, isError, error } = useStripeJobRuns(job, searchParams, {
    placeholderData: keepPreviousData,
  })

  const columns = useRunColumns()

  const { table } = useDataTable({
    data: runs ?? [],
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
    <Container className="divide-y p-0" data-testid="stripe-job-runs-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Runs</Heading>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count ?? 0}
        pageSize={PAGE_SIZE}
        isLoading={isPending}
        queryObject={raw}
        pagination
        noRecords={{ message: "The job has not run yet." }}
      />
    </Container>
  )
}

const JobDetail = () => {
  const { job: name } = useParams()
  const { jobs, isPending, isError, error } = useStripeJobs()
  const job = jobs?.find((j) => j.job === name)

  if (isError) {
    throw error
  }

  if (isPending || !job) {
    return <SingleColumnPageSkeleton sections={2} />
  }

  return (
    <SingleColumnPage data={job} showJSON data-testid="stripe-job-detail-page">
      <WidgetZone id="stripe.jobs.detail" data={job}>
        <JobGeneralSection job={job} />
        <JobRunsSection job={job.job} />
      </WidgetZone>
    </SingleColumnPage>
  )
}

const JobDetailPage = () => (
  <SettingsProviders>
    <JobDetail />
  </SettingsProviders>
)

export const handle = {
  breadcrumb: (match: UIMatch) => JOB_LABEL[match.params.job ?? ""] ?? match.params.job,
  permissions: "payouts:view",
}

export default JobDetailPage
