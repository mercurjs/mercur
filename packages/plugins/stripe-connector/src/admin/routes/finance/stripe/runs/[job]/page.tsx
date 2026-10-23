import { Container, Heading, Text } from "@medusajs/ui"
import { DateCell, SingleColumnPage, StatusCell, TextCell, TextHeader, _DataTable, useDataTable } from "@mercurjs/dashboard-shared"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useParams } from "react-router-dom"

import { useStripeJobRuns } from "../../../../../hooks/api/stripe"
import type { JobRunRow } from "../../../../../lib/client"
import { JOB_LABEL } from "../../../../../lib/status"
import { SettingsProviders } from "../../../../../providers/settings-providers"
import { useListParams } from "../../components/entity-table"

const columnHelper = createColumnHelper<JobRunRow>()

const RunsTable = ({ job }: { job: string }) => {
  const { raw, offset, limit } = useListParams()
  const { data, isPending, isError, error } = useStripeJobRuns(job, { offset, limit })
  const rows = useMemo(() => data?.runs ?? [], [data])

  const columns = useMemo(
    () => [
      columnHelper.accessor("started_at", { header: () => <TextHeader text="Started" />, cell: ({ getValue }) => <DateCell date={getValue()} /> }),
      columnHelper.accessor("finished_at", {
        header: () => <TextHeader text="Duration" />,
        cell: ({ row }) => {
          const { started_at, finished_at } = row.original
          if (!finished_at) return <TextCell text="running" />
          const ms = new Date(finished_at).getTime() - new Date(started_at).getTime()
          return <TextCell text={`${(ms / 1000).toFixed(1)} s`} />
        },
      }),
      columnHelper.accessor("trigger", { header: () => <TextHeader text="Trigger" />, cell: ({ getValue }) => <TextCell text={getValue()} /> }),
      columnHelper.accessor("status", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) => <StatusCell color={getValue() === "succeeded" ? "green" : getValue() === "failed" ? "red" : "blue"}>{getValue()}</StatusCell>,
      }),
      columnHelper.accessor("stats", {
        header: () => <TextHeader text="Stats" />,
        cell: ({ getValue }) => <TextCell text={getValue() ? Object.entries(getValue() as Record<string, unknown>).map(([k, v]) => `${k} ${v}`).join(", ") : "-"} />,
      }),
      columnHelper.accessor("error", { header: () => <TextHeader text="Error" />, cell: ({ getValue }) => <TextCell text={getValue() ?? "-"} /> }),
    ],
    []
  )

  const { table } = useDataTable({ data: rows, columns, count: data?.count ?? 0, enablePagination: true, getRowId: (row) => row.id, pageSize: limit })

  if (isError) throw error

  return (
    <Container className="divide-y p-0" data-testid="stripe-job-runs">
      <div className="px-6 py-4">
        <Heading>{JOB_LABEL[job] ?? job} runs</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Every execution of {job}, newest first.
        </Text>
      </div>
      <_DataTable table={table} columns={columns} count={data?.count ?? 0} pageSize={limit} isLoading={isPending} queryObject={raw} pagination noRecords={{ title: "No runs yet", message: "The job has not run since it was installed." }} />
    </Container>
  )
}

const JobRunsPage = () => {
  const { job = "" } = useParams()
  return (
    <SettingsProviders>
      <SingleColumnPage data-testid="stripe-job-runs-page">
        <RunsTable job={job} />
      </SingleColumnPage>
    </SettingsProviders>
  )
}

export const handle = {
  breadcrumb: () => "Runs",
  permissions: "payouts:view",
}

export default JobRunsPage
