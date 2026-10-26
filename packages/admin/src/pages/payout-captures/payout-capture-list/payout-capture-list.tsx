import { Children, ReactNode } from "react"
import { Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import { _DataTable } from "../../../components/table/data-table"
import { usePayoutCaptures } from "../../../hooks/api/payout-captures"
import { usePayoutCaptureTableColumns } from "../../../hooks/table/columns/use-payout-capture-table-columns"
import { usePayoutCaptureTableQuery } from "../../../hooks/table/query/use-payout-capture-table-query"
import { useDataTable } from "../../../hooks/use-data-table"

const PAGE_SIZE = 20

export const PayoutCaptureListTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <Heading data-testid="payout-capture-list-heading">
        {t("payoutCaptures.domain")}
      </Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("payoutCaptures.subtitle")}
      </Text>
    </div>
  )
}

export const PayoutCaptureListActions = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? children : null}
    </div>
  )
}

export const PayoutCaptureListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="payout-capture-list-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PayoutCaptureListTitle />
          <PayoutCaptureListActions />
        </>
      )}
    </div>
  )
}

export const PayoutCaptureListDataTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = usePayoutCaptureTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { captures, count, isError, error, isLoading } = usePayoutCaptures(
    searchParams,
    { placeholderData: keepPreviousData },
  )

  const columns = usePayoutCaptureTableColumns()

  const { table } = useDataTable({
    data: captures ?? [],
    columns,
    enablePagination: true,
    count: count ?? 0,
    getRowId: (row) => row.order_group_id,
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
      navigateTo={(row) => row.original.order_group_id}
      count={count ?? 0}
      isLoading={isLoading}
      pageSize={PAGE_SIZE}
      queryObject={raw}
      noRecords={{
        title: t("payoutCaptures.list.noRecordsTitle"),
        message: t("payoutCaptures.list.noRecordsMessage"),
      }}
    />
  )
}

export const PayoutCaptureListTable = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <Container
      className="divide-y p-0"
      data-testid="payout-capture-list-container"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PayoutCaptureListHeader />
          <PayoutCaptureListDataTable />
        </>
      )}
    </Container>
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="payout_captures.list">
        {Children.count(children) > 0 ? children : <PayoutCaptureListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const PayoutCaptureListPage = Object.assign(Root, {
  Table: PayoutCaptureListTable,
  Header: PayoutCaptureListHeader,
  HeaderTitle: PayoutCaptureListTitle,
  HeaderActions: PayoutCaptureListActions,
  DataTable: PayoutCaptureListDataTable,
})
