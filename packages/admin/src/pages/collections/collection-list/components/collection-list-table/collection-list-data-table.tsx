import { HttpTypes } from "@medusajs/types"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import { useExtendableTable, useLinkQuery } from "@mercurjs/dashboard-shared"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { _DataTable } from "../../../../../components/table/data-table"
import { useCollections } from "../../../../../hooks/api/collections"
import { useCollectionTableColumns } from "../../../../../hooks/table/columns/use-collection-table-columns"
import { useCollectionTableFilters } from "../../../../../hooks/table/filters"
import { useCollectionTableQuery } from "../../../../../hooks/table/query"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { CollectionRowActions } from "./collection-row-actions"

const PAGE_SIZE = 20

export const CollectionListDataTable = () => {
  const { t } = useTranslation()
  const { searchParams, raw } = useCollectionTableQuery({ pageSize: PAGE_SIZE })
  const { collections, count, isError, error, isLoading } = useCollections(
    {
      ...searchParams,
      ...useLinkQuery("collection", "+products.id"),
    },
    {
      placeholderData: keepPreviousData,
    }
  )

  const baseFilters = useCollectionTableFilters()
  const { columns, filters: extFilters } = useColumns()
  const filters = useMemo(
    () => [...baseFilters, ...(extFilters as typeof baseFilters)],
    [baseFilters, extFilters]
  )

  const { table } = useDataTable({
    data: collections ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row, index) => row.id ?? `${index}`,
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
      filters={filters}
      orderBy={[
        { key: "title", label: t("fields.title") },
        { key: "handle", label: t("fields.handle") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      search
      navigateTo={(row) => `/collections/${row.original.id}`}
      queryObject={raw}
      isLoading={isLoading}
    />
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminCollection>()

const useColumns = () => {
  const base = useCollectionTableColumns()
  const { columns: extended, filters } = useExtendableTable<HttpTypes.AdminCollection>({
    model: "collection",
    columns: base as unknown as ColumnDef<HttpTypes.AdminCollection, unknown>[],
  })

  const columns = useMemo(
    () => [
      ...extended,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <CollectionRowActions collection={row.original} />,
      }),
    ],
    [extended]
  )

  return { columns, filters }
}
