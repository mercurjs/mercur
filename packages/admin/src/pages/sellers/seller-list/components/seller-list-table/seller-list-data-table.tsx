import { useMemo } from "react"

import { PencilSquare } from "@medusajs/icons"

import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"

import { useSellers } from "../../../../../hooks/api/sellers"
import { useSellersTableColumns } from "../../../../../hooks/table/columns/use-seller-table-columns"
import { useSellerTableFilters } from "../../../../../hooks/table/filters"
import { useSellersTableQuery } from "../../../../../hooks/table/query"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { SellerDTO } from "@mercurjs/types"

const PAGE_SIZE = 10

export const SellerListDataTable = () => {
  const { searchParams, raw } = useSellersTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { sellers, count, isLoading } = useSellers(
    {
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    },
  )

  const columns = useColumns()
  const filters = useSellerTableFilters()

  const { table } = useDataTable({
    data: sellers ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row?.id || "",
  })

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count ?? 0}
      pageSize={PAGE_SIZE}
      filters={filters}
      isLoading={isLoading}
      queryObject={raw}
      search
      pagination
      navigateTo={(row) => `/sellers/${row.original.id}`}
      orderBy={[
        { key: "email", label: "Email" },
        { key: "name", label: "Name" },
        { key: "created_at", label: "Created" },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<SellerDTO>()

const SellerActions = ({ seller }: { seller: SellerDTO }) => {
  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: "Edit",
              to: `/sellers/${seller.id}/edit`,
            },
          ],
        },
      ]}
    />
  )
}

const useColumns = () => {
  const base = useSellersTableColumns()

  return useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <SellerActions seller={row.original} />,
      }),
    ],
    [base],
  )
}
