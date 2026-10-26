import { Children, ReactNode, useMemo } from "react"
import { ArrowPath } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "../../../components/common/action-menu"
import { SingleColumnPage } from "../../../components/layout/pages"
import { _DataTable } from "../../../components/table/data-table"
import { AdminTransfer, useTransfers } from "../../../hooks/api/transfers"
import { useTransferTableColumns } from "../../../hooks/table/columns/use-transfer-table-columns"
import { useTransferTableFilters } from "../../../hooks/table/filters/use-transfer-table-filters"
import { useTransferTableQuery } from "../../../hooks/table/query/use-transfer-table-query"
import { useDataTable } from "../../../hooks/use-data-table"
import { useRetryTransferAction } from "../common/hooks/use-retry-transfer-action"
import { TRANSFER_TYPES } from "../common/utils"

const PAGE_SIZE = 20

export const TransferListTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <Heading data-testid="transfer-list-heading">
        {t("transfers.domain")}
      </Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("transfers.subtitle")}
      </Text>
    </div>
  )
}

export const TransferListActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? children : null}
    </div>
  )
}

export const TransferListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="transfer-list-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <TransferListTitle />
          <TransferListActions />
        </>
      )}
    </div>
  )
}

const TransferRowActions = ({ transfer }: { transfer: AdminTransfer }) => {
  const { t } = useTranslation()
  const { handleRetry, canRetry } = useRetryTransferAction(transfer)

  return (
    <ActionMenu
      data-testid={`transfer-list-row-actions-${transfer.id}`}
      groups={[
        {
          actions: [
            {
              icon: <ArrowPath />,
              label: t("transfers.actions.retry"),
              onClick: handleRetry,
              permission: "payouts:edit",
              disabled: !canRetry,
              disabledTooltip: t("transfers.retry.disabledTooltip"),
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<AdminTransfer>()

const useColumns = () => {
  const base = useTransferTableColumns()

  return useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <TransferRowActions transfer={row.original} />,
      }),
    ],
    [base],
  )
}

export const TransferListDataTable = ({
  reversals = false,
}: {
  reversals?: boolean
}) => {
  const { t } = useTranslation()

  const { searchParams, raw } = useTransferTableQuery({ pageSize: PAGE_SIZE })

  const { transfers, count, isError, error, isLoading } = useTransfers(
    {
      ...searchParams,
      type: reversals
        ? "refund_reversal"
        : (searchParams.type ?? TRANSFER_TYPES.filter((type) => type !== "refund_reversal")),
    },
    { placeholderData: keepPreviousData },
  )

  const columns = useColumns()
  const filters = useTransferTableFilters({ excludeType: reversals })

  const { table } = useDataTable({
    data: transfers ?? [],
    columns,
    enablePagination: true,
    count: count ?? 0,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      columns={columns}
      table={table}
      pagination
      navigateTo={(row) => row.original.id}
      count={count ?? 0}
      filters={filters}
      isLoading={isLoading}
      pageSize={PAGE_SIZE}
      orderBy={[
        { key: "status", label: t("fields.status") },
        ...(reversals
          ? []
          : [{ key: "type" as const, label: t("fields.type") }]),
        { key: "amount", label: t("fields.amount") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      defaultOrder="-created_at"
      queryObject={raw}
      noRecords={{
        message: reversals
          ? t("reversals.list.noRecordsMessage")
          : t("transfers.list.noRecordsMessage"),
      }}
    />
  )
}

export const TransferListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0" data-testid="transfer-list-container">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <TransferListHeader />
          <TransferListDataTable />
        </>
      )}
    </Container>
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="transfers.list">
        {Children.count(children) > 0 ? children : <TransferListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const TransferListPage = Object.assign(Root, {
  Table: TransferListTable,
  Header: TransferListHeader,
  HeaderTitle: TransferListTitle,
  HeaderActions: TransferListActions,
  DataTable: TransferListDataTable,
})
