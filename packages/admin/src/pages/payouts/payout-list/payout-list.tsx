import { Children, ReactNode, useMemo } from "react"
import { ArrowPath } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "../../../components/common/action-menu"
import { SingleColumnPage } from "../../../components/layout/pages"
import { _DataTable } from "../../../components/table/data-table"
import { usePayouts } from "../../../hooks/api/payouts"
import { AdminPayout } from "../../../lib/payouts"
import { usePayoutTableColumns } from "../../../hooks/table/columns/use-payout-table-columns"
import { usePayoutTableFilters } from "../../../hooks/table/filters/use-payout-table-filters"
import { usePayoutTableQuery } from "../../../hooks/table/query/use-payout-table-query"
import { useDataTable } from "../../../hooks/use-data-table"
import { useRetryPayoutAction } from "../common/hooks/use-retry-payout-action"

const PAGE_SIZE = 20

const PayoutRowActions = ({ payout }: { payout: AdminPayout }) => {
  const { t } = useTranslation()
  const { handleRetry, canRetry } = useRetryPayoutAction(payout)

  return (
    <ActionMenu
      data-testid={`payout-list-row-actions-${payout.id}`}
      groups={[
        {
          actions: [
            {
              icon: <ArrowPath />,
              label: t("payouts.actions.retry"),
              onClick: handleRetry,
              permission: "payouts:edit",
              disabled: !canRetry,
              disabledTooltip: t("payouts.retry.disabledTooltip"),
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<AdminPayout>()

const useColumns = () => {
  const base = usePayoutTableColumns()

  return useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <PayoutRowActions payout={row.original} />,
      }),
    ],
    [base],
  )
}

export const PayoutListTitle = () => {
  const { t } = useTranslation()

  return (
    <Heading level="h2" data-testid="payout-list-heading">
      {t("payouts.domain")}
    </Heading>
  )
}

export const PayoutListActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? children : null}
    </div>
  )
}

export const PayoutListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PayoutListTitle />
          <PayoutListActions />
        </>
      )}
    </div>
  )
}

export const PayoutListDataTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = usePayoutTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { payouts, count, isError, error, isLoading } = usePayouts(
    searchParams,
    {
      placeholderData: keepPreviousData,
    },
  )

  const columns = useColumns()
  const filters = usePayoutTableFilters()

  const { table } = useDataTable({
    data: payouts ?? [],
    columns,
    enablePagination: true,
    count: count ?? 0,
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
      navigateTo={(row) => `/payouts/${row.original.id}`}
      count={count ?? 0}
      filters={filters}
      search
      isLoading={isLoading}
      pageSize={PAGE_SIZE}
      orderBy={[
        { key: "status", label: t("fields.status") },
        { key: "amount", label: t("fields.amount") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      defaultOrder="-created_at"
      queryObject={raw}
      noRecords={{
        message: t("payouts.list.empty"),
      }}
    />
  )
}

export const PayoutListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PayoutListHeader />
          <PayoutListDataTable />
        </>
      )}
    </Container>
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="payouts.list">
        {Children.count(children) > 0 ? children : <PayoutListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const PayoutListPage = Object.assign(Root, {
  Table: PayoutListTable,
  Header: PayoutListHeader,
  HeaderTitle: PayoutListTitle,
  HeaderActions: PayoutListActions,
  DataTable: PayoutListDataTable,
})
