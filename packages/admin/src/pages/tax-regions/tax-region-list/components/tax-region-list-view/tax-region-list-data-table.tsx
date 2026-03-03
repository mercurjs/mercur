import { keepPreviousData } from "@tanstack/react-query"

import { useTaxRegions } from "../../../../../hooks/api/tax-regions"
import { useTaxRegionTableQuery } from "../../../../../hooks/table/query/use-tax-region-table-query"
import { TaxRegionTable } from "../../../common/components/tax-region-table"
import { useTaxRegionTable } from "../../../common/hooks/use-tax-region-table"

const PAGE_SIZE = 20

export const TaxRegionListDataTable = () => {
  const { searchParams, raw } = useTaxRegionTableQuery({
    pageSize: PAGE_SIZE,
  })
  const { tax_regions, count, isPending, isError, error } = useTaxRegions(
    {
      ...searchParams,
      parent_id: "null",
    },
    {
      placeholderData: keepPreviousData,
    },
  )

  const { table } = useTaxRegionTable({
    count,
    data: tax_regions,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <TaxRegionTable
      renderHeader={false}
      isPending={isPending}
      queryObject={raw}
      table={table}
      count={count}
    />
  )
}
