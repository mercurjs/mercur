import { Children, ReactNode } from "react"
import { Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import { _DataTable } from "../../../components/table/data-table"
import { usePayoutAccounts } from "../../../hooks/api/payout-accounts"
import { usePayoutAccountTableColumns } from "../../../hooks/table/columns/use-payout-account-table-columns"
import { usePayoutAccountTableFilters } from "../../../hooks/table/filters/use-payout-account-table-filters"
import { usePayoutAccountTableQuery } from "../../../hooks/table/query/use-payout-account-table-query"
import { useDataTable } from "../../../hooks/use-data-table"

const PAGE_SIZE = 20

export const PayoutAccountListTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <Heading data-testid="payout-account-list-heading">
        {t("payoutAccounts.domain")}
      </Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("payoutAccounts.subtitle")}
      </Text>
    </div>
  )
}

export const PayoutAccountListActions = ({
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

export const PayoutAccountListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="payout-account-list-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PayoutAccountListTitle />
          <PayoutAccountListActions />
        </>
      )}
    </div>
  )
}

export const PayoutAccountListDataTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = usePayoutAccountTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { payout_accounts, count, isError, error, isLoading } =
    usePayoutAccounts(searchParams, {
      placeholderData: keepPreviousData,
    })

  const columns = usePayoutAccountTableColumns()
  const filters = usePayoutAccountTableFilters()

  const { table } = useDataTable({
    data: payout_accounts ?? [],
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
        { key: "kyc_status", label: t("payoutAccounts.fields.kycStatus") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      defaultOrder="-created_at"
      queryObject={raw}
      noRecords={{
        message: t("payoutAccounts.list.noRecordsMessage"),
      }}
    />
  )
}

export const PayoutAccountListTable = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <Container
      className="divide-y p-0"
      data-testid="payout-account-list-container"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PayoutAccountListHeader />
          <PayoutAccountListDataTable />
        </>
      )}
    </Container>
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="payout_accounts.list">
        {Children.count(children) > 0 ? children : <PayoutAccountListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const PayoutAccountListPage = Object.assign(Root, {
  Table: PayoutAccountListTable,
  Header: PayoutAccountListHeader,
  HeaderTitle: PayoutAccountListTitle,
  HeaderActions: PayoutAccountListActions,
  DataTable: PayoutAccountListDataTable,
})
