import { Button, Container, Heading, Text } from "@medusajs/ui"

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import { useExtendableTable, useLinkQuery } from "@mercurjs/dashboard-shared"
import { _DataTable } from "@components/table/data-table"
import { useReservationItems } from "@hooks/api/reservations"
import { useDataTable } from "@hooks/use-data-table"
import { useReservationTableColumns } from "./use-reservation-table-columns"
import { useReservationTableFilters } from "./use-reservation-table-filters"
import { useReservationTableQuery } from "./use-reservation-table-query"
import { ReservationActions } from "./reservation-actions"
import { ExtendedReservationItem } from "../../../inventory/[id]/_components/reservations-table/use-reservation-list-table-columns"
import { Link } from "react-router-dom"

const PAGE_SIZE = 20

const columnHelper = createColumnHelper<ExtendedReservationItem>()

const useColumns = () => {
  const base = useReservationTableColumns()
  const { columns: extended, filters } =
    useExtendableTable<ExtendedReservationItem>({
      model: "reservation",
      columns: base as unknown as ColumnDef<ExtendedReservationItem, unknown>[],
    })

  const columns = useMemo(
    () => [
      ...extended,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <ReservationActions reservation={row.original} />
        },
      }),
    ],
    [extended]
  )

  return { columns, filters }
}

export const ReservationListTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = useReservationTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { reservations, count, isPending } =
    useReservationItems({
      ...searchParams,
      ...useLinkQuery("reservation"),
    })

  const baseFilters = useReservationTableFilters()
  const { columns, filters: extFilters } = useColumns()
  const filters = useMemo(
    () => [...baseFilters, ...(extFilters as typeof baseFilters)],
    [baseFilters, extFilters]
  )

  const { table } = useDataTable({
    data: reservations || [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("reservations.domain")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("reservations.subtitle")}
          </Text>
        </div>
        <Button variant="secondary" size="small" asChild>
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        isLoading={isPending}
        filters={filters}
        queryObject={raw}
        pagination
        search
        orderBy={[
          { key: "inventory_item.title", label: t("fields.title") },
          { key: "inventory_item.sku", label: t("fields.sku") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        defaultOrderBy="inventory_item.title"
        navigateTo={(row) => row.id}
        noRecords={{
          title: t("reservations.list.noRecordsTitle"),
          message: t("reservations.list.noRecordsMessage"),
          action: {
            to: "create",
            label: t("actions.create"),
          },
        }}
      />
    </Container>
  )
}
