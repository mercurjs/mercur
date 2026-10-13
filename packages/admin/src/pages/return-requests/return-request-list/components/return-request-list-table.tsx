import { ArrowUturnLeft } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { Children, ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../../components/table/data-table"
import { StatusCell } from "../../../../components/table/table-cells/common/status-cell"
import { DateCell } from "../../../../components/table/table-cells/common/date-cell"
import { useDataTable } from "../../../../hooks/use-data-table"
import {
  AdminReturnRequest,
  useReturnRequests,
} from "../../../../hooks/api/return-requests"
import { customerName, getReturnRequestStatusColor } from "../../common/utils"
import { useReturnRequestTableFilters } from "../use-return-request-table-filters"
import { useReturnRequestTableQuery } from "../use-return-request-table-query"

const PAGE_SIZE = 20

export const ReturnRequestListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading level="h2" data-testid="return-request-list-table-heading">
        {t("returnRequests.domain")}
      </Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("returnRequests.subtitle")}
      </Text>
    </div>
  )
}

export const ReturnRequestListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="return-request-list-table-header"
    >
      {Children.count(children) > 0 ? children : <ReturnRequestListTitle />}
    </div>
  )
}

const columnHelper = createColumnHelper<AdminReturnRequest>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("order", {
        header: t("returnRequests.fields.order"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="truncate">
            #{getValue()?.display_id ?? "-"}
          </Text>
        ),
      }),
      columnHelper.accessor("seller", {
        header: t("returnRequests.fields.store"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="truncate">
            {getValue()?.name || "-"}
          </Text>
        ),
      }),
      columnHelper.accessor("customer", {
        header: t("returnRequests.fields.customer"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="truncate">
            {customerName(getValue())}
          </Text>
        ),
      }),
      columnHelper.accessor("requested_by_type", {
        header: t("returnRequests.fields.requestedBy"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact">
            {t(`returnRequests.actor.${getValue()}`)}
          </Text>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: t("returnRequests.fields.date"),
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("status", {
        header: t("returnRequests.fields.status"),
        cell: ({ getValue }) => {
          const status = getValue()
          return (
            <StatusCell color={getReturnRequestStatusColor(status)}>
              {t(`returnRequests.status.${status}`)}
            </StatusCell>
          )
        },
      }),
    ],
    [t]
  )
}

export const ReturnRequestListDataTable = () => {
  const { t } = useTranslation()
  const { raw, searchParams } = useReturnRequestTableQuery({
    pageSize: PAGE_SIZE,
  })
  const filters = useReturnRequestTableFilters()

  const {
    return_requests: returnRequests,
    count,
    isPending,
    isError,
    error,
  } = useReturnRequests(searchParams, { placeholderData: keepPreviousData })

  const columns = useColumns()

  const { table } = useDataTable({
    data: returnRequests ?? [],
    columns,
    count,
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
      count={count}
      pageSize={PAGE_SIZE}
      pagination
      filters={filters}
      navigateTo={(row) => row.id}
      isLoading={isPending}
      queryObject={raw}
      defaultOrder="-created_at"
      orderBy={[
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      noRecords={{
        title: t("returnRequests.list.noRecordsTitle"),
        message: t("returnRequests.list.noRecordsMessage"),
        icon: <ArrowUturnLeft />,
      }}
      noResults={{
        icon: <ArrowUturnLeft />,
      }}
      data-testid="return-request-list-table"
    />
  )
}

export const ReturnRequestListTable = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <Container
      className="divide-y p-0"
      data-testid="return-request-list-table-container"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ReturnRequestListHeader />
          <ReturnRequestListDataTable />
        </>
      )}
    </Container>
  )
}
