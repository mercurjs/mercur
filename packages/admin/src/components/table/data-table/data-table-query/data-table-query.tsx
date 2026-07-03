import { ReactNode } from "react"

import { Filter } from ".."
import { DataTableFilter } from "../data-table-filter"
import { DataTableOrderBy, DataTableOrderByKey } from "../data-table-order-by"
import { DataTableSearch } from "../data-table-search"

export interface DataTableQueryProps<TData> {
  search?: boolean | "autofocus"
  orderBy?: DataTableOrderByKey<TData>[]
  defaultOrder?: string
  filters?: Filter[]
  prefix?: string
  toolbarActions?: ReactNode
}

export const DataTableQuery = <TData,>({
  search,
  orderBy,
  defaultOrder,
  filters,
  prefix,
  toolbarActions,
}: DataTableQueryProps<TData>) => {
  return (
    (search || orderBy || filters || prefix || toolbarActions) && (
      <div className="flex items-start justify-between gap-x-4 px-6 py-4">
        <div className="w-full max-w-[60%]">
          {filters && filters.length > 0 && (
            <DataTableFilter filters={filters} prefix={prefix} />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-x-2">
          {search && (
            <DataTableSearch
              prefix={prefix}
              autofocus={search === "autofocus"}
            />
          )}
          {orderBy && (
            <DataTableOrderBy
              keys={orderBy}
              prefix={prefix}
              defaultOrder={defaultOrder}
            />
          )}
          {toolbarActions}
        </div>
      </div>
    )
  )
}
