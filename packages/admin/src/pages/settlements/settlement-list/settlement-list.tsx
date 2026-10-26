import { Children, ReactNode } from "react"
import { Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import { _DataTable } from "../../../components/table/data-table"
import { useSettlements } from "../../../hooks/api/settlements"
import { useSettlementTableColumns } from "../../../hooks/table/columns/use-settlement-table-columns"
import { useSettlementTableFilters } from "../../../hooks/table/filters/use-settlement-table-filters"
import { useSettlementTableQuery } from "../../../hooks/table/query/use-settlement-table-query"
import { useDataTable } from "../../../hooks/use-data-table"

const PAGE_SIZE = 20

export const SettlementListTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <Heading data-testid="settlement-list-heading">
        {t("settlements.domain")}
      </Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("settlements.subtitle")}
      </Text>
    </div>
  )
}

export const SettlementListActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? children : null}
    </div>
  )
}

export const SettlementListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="settlement-list-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <SettlementListTitle />
          <SettlementListActions />
        </>
      )}
    </div>
  )
}

export const SettlementListDataTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = useSettlementTableQuery({ pageSize: PAGE_SIZE })

  const { settlements, count, isError, error, isLoading } = useSettlements(
    searchParams,
    { placeholderData: keepPreviousData },
  )

  const columns = useSettlementTableColumns()
  const filters = useSettlementTableFilters()

  const { table } = useDataTable({
    data: settlements ?? [],
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
      queryObject={raw}
      noRecords={{
        message: t("settlements.list.noRecordsMessage"),
      }}
    />
  )
}

export const SettlementListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0" data-testid="settlement-list-container">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <SettlementListHeader />
          <SettlementListDataTable />
        </>
      )}
    </Container>
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="settlements.list">
        {Children.count(children) > 0 ? children : <SettlementListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const SettlementListPage = Object.assign(Root, {
  Table: SettlementListTable,
  Header: SettlementListHeader,
  HeaderTitle: SettlementListTitle,
  HeaderActions: SettlementListActions,
  DataTable: SettlementListDataTable,
})
