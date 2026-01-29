import { Button, Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { _DataTable } from "../../../../../components/table/data-table"
import { usePriceLists } from "../../../../../hooks/api/price-lists"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { usePricingTableColumns } from "./use-pricing-table-columns"
import { usePricingTableFilters } from "./use-pricing-table-filters"
import { usePricingTableQuery } from "./use-pricing-table-query"

const PAGE_SIZE = 20

export const PriceListListTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = usePricingTableQuery({
    pageSize: PAGE_SIZE,
  })
  const { price_lists, count, isLoading, isError, error } = usePriceLists(
    searchParams,
    {
      placeholderData: keepPreviousData,
    }
  )

  const filters = usePricingTableFilters()
  const columns = usePricingTableColumns()

  const { table } = useDataTable({
    data: price_lists || [],
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
    <Container className="divide-y p-0" data-testid="price-list-list-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="price-list-list-header">
        <div>
          <Heading data-testid="price-list-list-heading">{t("priceLists.domain")}</Heading>
          <Text className="text-ui-fg-subtle" size="small" data-testid="price-list-list-subtitle">
            {t("priceLists.subtitle")}
          </Text>
        </div>
        <Button size="small" variant="secondary" asChild data-testid="price-list-list-create-button">
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count}
        filters={filters}
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "status", label: t("fields.status") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        queryObject={raw}
        pageSize={PAGE_SIZE}
        navigateTo={(row) => row.original.id}
        isLoading={isLoading}
        pagination
        search
        data-testid="price-list-list-table"
      />
    </Container>
  )
}
