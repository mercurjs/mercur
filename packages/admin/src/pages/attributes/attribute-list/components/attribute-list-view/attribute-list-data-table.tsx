import { keepPreviousData } from "@tanstack/react-query"
import { useLoaderData } from "react-router-dom"

import { _DataTable } from "../../../../../components/table/data-table"
import { useAttributes } from "../../../../../hooks/api"
import { useAttributeTableColumns } from "../../../../../hooks/table/columns/use-attribute-table-columns"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { attributeListLoader } from "../../loader"

const PAGE_SIZE = 10

export const AttributeListDataTable = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof attributeListLoader>
  >

  const { attributes, count, isPending, isError, error } = useAttributes(
    { limit: PAGE_SIZE, offset: 0 },
    {
      initialData,
      placeholderData: keepPreviousData,
    }
  )

  const columns = useAttributeTableColumns()

  const { table } = useDataTable({
    data: attributes ?? [],
    count,
    columns,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      isLoading={isPending}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={count}
      navigateTo={(row) => row.original.id}
      search
      pagination
      data-testid="attribute-list-table"
    />
  )
}
