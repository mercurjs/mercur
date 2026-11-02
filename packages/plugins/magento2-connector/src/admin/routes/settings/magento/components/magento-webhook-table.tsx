import { Button, Container, Heading, Text } from "@medusajs/ui"
import {
  DateCell,
  StatusCell,
  TextCell,
  TextHeader,
  _DataTable,
  useDataTable,
  useQueryParams,
} from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { Link } from "react-router-dom"

import { useMagentoWebhooks } from "../../../../hooks/api/magento"
import { useActionBlocker } from "../../../../hooks/use-action-blocker"
import type { MagentoWebhook } from "../../../../lib/client"

const PAGE_SIZE = 20

export const MagentoWebhookTable = () => (
  <Container className="divide-y p-0" data-testid="magento-webhook-table">
    <MagentoWebhookHeader />
    <MagentoWebhookDataTable />
  </Container>
)

const MagentoWebhookHeader = () => {
  const createBlocker = useActionBlocker("integrations", "manage")

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <Heading>Webhooks</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Endpoints in Magento that receive offer, seller, product and order events.
        </Text>
      </div>
      <Button
        size="small"
        variant="secondary"
        asChild
        disabled={createBlocker.disabled}
        data-testid="magento-webhook-create-button"
      >
        <Link to="create">Add endpoint</Link>
      </Button>
    </div>
  )
}

const MagentoWebhookDataTable = () => {
  const raw = useQueryParams(["offset"])
  const searchParams = {
    limit: PAGE_SIZE,
    offset: raw.offset ? Number(raw.offset) : 0,
  }

  const { webhooks, count, isPending, isError, error } = useMagentoWebhooks(searchParams, {
    placeholderData: keepPreviousData,
  })

  const data = useMemo(() => webhooks ?? [], [webhooks])
  const columns = useColumns()

  const { table } = useDataTable({
    data,
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
    <_DataTable
      table={table}
      columns={columns}
      count={count ?? 0}
      pageSize={PAGE_SIZE}
      isLoading={isPending}
      queryObject={raw}
      pagination
      navigateTo={(row) => row.original.id}
      noRecords={{
        title: "No webhook endpoints yet",
        message: "Add the endpoint your Magento connector exposes to start receiving events.",
      }}
    />
  )
}

const columnHelper = createColumnHelper<MagentoWebhook>()

const useColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("url", {
        header: () => <TextHeader text="URL" />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("events", {
        header: () => <TextHeader text="Events" />,
        cell: ({ getValue }) => <TextCell text={`${getValue().length} events`} />,
      }),
      columnHelper.accessor("is_active", {
        header: () => <TextHeader text="Status" />,
        cell: ({ getValue }) =>
          getValue() ? (
            <StatusCell color="green">Active</StatusCell>
          ) : (
            <StatusCell color="grey">Paused</StatusCell>
          ),
      }),
      columnHelper.accessor("created_at", {
        header: () => <TextHeader text="Created" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
    ],
    []
  )
