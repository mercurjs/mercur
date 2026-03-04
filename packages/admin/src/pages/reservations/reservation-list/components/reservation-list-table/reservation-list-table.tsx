import { Button, Container, Heading, Text } from "@medusajs/ui"

import { Children, ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { _DataTable } from "@/components/table/data-table"
import { useReservationItems } from "@/hooks/api/reservations"
import { useDataTable } from "@/hooks/use-data-table"

import { useReservationTableColumns } from "./use-reservation-table-columns"
import { useReservationTableFilters } from "./use-reservation-table-filters"
import { useReservationTableQuery } from "./use-reservation-table-query"

const PAGE_SIZE = 20

export const ReservationListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading>{t("reservations.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("reservations.subtitle")}
      </Text>
    </div>
  )
}

export const ReservationListCreateButton = () => {
  const { t } = useTranslation()
  return (
    <Button variant="secondary" size="small" asChild>
      <Link to="create">{t("actions.create")}</Link>
    </Button>
  )
}

export const ReservationListActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? children : <ReservationListCreateButton />}
    </div>
  )
}

export const ReservationListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ReservationListTitle />
          <ReservationListActions />
        </>
      )}
    </div>
  )
}

export const ReservationListDataTable = () => {
  const { searchParams, raw } = useReservationTableQuery({
    pageSize: PAGE_SIZE,
  })
  const { reservations, count, isPending, isError, error } =
    useReservationItems({
      ...searchParams,
    })

  const filters = useReservationTableFilters()
  const columns = useReservationTableColumns()

  const { table } = useDataTable({
    data: reservations || [],
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
      pageSize={PAGE_SIZE}
      count={count}
      isLoading={isPending}
      filters={filters}
      queryObject={raw}
      pagination
      navigateTo={(row) => row.id}
      search={false}
    />
  )
}

export const ReservationListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ReservationListHeader />
          <ReservationListDataTable />
        </>
      )}
    </Container>
  )
}
