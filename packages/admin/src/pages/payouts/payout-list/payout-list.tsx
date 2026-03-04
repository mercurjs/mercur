import { Children, ReactNode } from "react"
import { Container, Heading } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { SingleColumnPage } from "../../../components/layout/pages"
import { _DataTable } from "../../../components/table/data-table"
import { usePayouts } from "../../../hooks/api/payouts"
import { usePayoutTableColumns } from "../../../hooks/table/columns/use-payout-table-columns"
import { usePayoutTableQuery } from "../../../hooks/table/query/use-payout-table-query"
import { useDataTable } from "../../../hooks/use-data-table"
import { PayoutDTO } from "@mercurjs/types"

const PAGE_SIZE = 10

export const PayoutListTitle = () => {
  return (
    <Heading level="h2">Payouts</Heading>
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

  const columns = usePayoutTableColumns()

  const { table } = useDataTable({
    data: (payouts as PayoutDTO[]) ?? [],
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
      search
      isLoading={isLoading}
      pageSize={PAGE_SIZE}
      orderBy={[
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      queryObject={raw}
      noRecords={{
        message: "No payouts found",
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
      {Children.count(children) > 0 ? children : <PayoutListTable />}
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
