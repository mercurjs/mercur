import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { keepPreviousData } from "@tanstack/react-query"
import { useMemo } from "react"
import { _DataTable } from "@components/table/data-table"
import { useCollections } from "@hooks/api/collections"
import { useCollectionTableColumns } from "@hooks/table/columns/use-collection-table-columns"
import { useCollectionTableFilters } from "@hooks/table/filters"
import { useCollectionTableQuery } from "@hooks/table/query"
import { useDataTable } from "@hooks/use-data-table"

const PAGE_SIZE = 20

export const CollectionListTable = () => {
  const { t } = useTranslation()
  const { searchParams, raw } = useCollectionTableQuery({
    pageSize: PAGE_SIZE,
  })
  const { product_collections, count, isError, error, isLoading } =
    useCollections(
      {
        ...searchParams,
        fields: "*products",
      },
      {
        placeholderData: keepPreviousData,
      }
    )

  const filters = useCollectionTableFilters()
  const columns = useColumns()

  const { table } = useDataTable({
    data: product_collections ?? [],
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
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("collections.domain")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("collections.subtitle")}
          </Text>
        </div>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        filters={filters}
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "handle", label: t("fields.handle") },
          {
            key: "created_at",
            label: t("fields.createdAt"),
          },
          {
            key: "updated_at",
            label: t("fields.updatedAt"),
          },
        ]}
        search
        navigateTo={(row) => `/collections/${row.original.id}`}
        queryObject={raw}
        isLoading={isLoading}
      />
    </Container>
  )
}

const useColumns = () => {
  const base = useCollectionTableColumns()

  return useMemo(() => [...base], [base])
}
