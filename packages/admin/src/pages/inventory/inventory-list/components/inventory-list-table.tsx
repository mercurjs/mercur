import { InventoryTypes, ProductVariantDTO } from "@medusajs/types"
import { Button, Container, Heading, Text } from "@medusajs/ui"

import { RowSelectionState } from "@tanstack/react-table"
import { Children, ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { _DataTable } from "../../../../components/table/data-table"
import { useInventoryItems } from "../../../../hooks/api/inventory"
import { useDataTable } from "../../../../hooks/use-data-table"
import { INVENTORY_ITEM_IDS_KEY } from "../../common/constants"
import { useInventoryTableColumns } from "./use-inventory-table-columns"
import { useInventoryTableFilters } from "./use-inventory-table-filters"
import { useInventoryTableQuery } from "./use-inventory-table-query"

/**
 * Extended type matching the columns definition — API returns these fields
 * but they're not in the base InventoryItemDTO.
 */
interface ExtendedInventoryItem extends InventoryTypes.InventoryItemDTO {
  variants?: ProductVariantDTO[] | null
  stocked_quantity?: number
  reserved_quantity?: number
}

const PAGE_SIZE = 20

export const InventoryListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading data-testid="inventory-list-title">{t("inventory.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small" data-testid="inventory-list-subtitle">
        {t("inventory.subtitle")}
      </Text>
    </div>
  )
}

export const InventoryListCreateButton = () => {
  const { t } = useTranslation()
  return (
    <Button size="small" variant="secondary" asChild data-testid="inventory-create-button">
      <Link to="create" data-testid="inventory-create-link">{t("actions.create")}</Link>
    </Button>
  )
}

export const InventoryListActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? children : <InventoryListCreateButton />}
    </div>
  )
}

export const InventoryListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="inventory-list-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <InventoryListTitle />
          <InventoryListActions />
        </>
      )}
    </div>
  )
}

export const InventoryListDataTable = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [selection, setSelection] = useState<RowSelectionState>({})

  const { searchParams, raw } = useInventoryTableQuery({
    pageSize: PAGE_SIZE,
  })

  const {
    inventory_items,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useInventoryItems({
    ...searchParams,
  })

  const filters = useInventoryTableFilters()
  const columns = useInventoryTableColumns()

  const { table } = useDataTable({
    data: (inventory_items ?? []) as ExtendedInventoryItem[],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    enableRowSelection: true,
    rowSelection: {
      state: selection,
      updater: setSelection,
    },
  })

  if (isError) {
    throw error
  }

  return (
    <div data-testid="inventory-data-table">
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        isLoading={isLoading}
        pagination
        search
        filters={filters}
        queryObject={raw}
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "sku", label: t("fields.sku") },
          { key: "stocked_quantity", label: t("fields.inStock") },
          { key: "reserved_quantity", label: t("inventory.reserved") },
        ]}
        navigateTo={(row) => `${row.id}`}
        commands={[
          {
            action: async (selection) => {
              navigate(
                `stock?${INVENTORY_ITEM_IDS_KEY}=${Object.keys(selection).join(
                  ","
                )}`
              )
            },
            label: t("inventory.stock.action"),
            shortcut: "i",
          },
        ]}
      />
    </div>
  )
}

export const InventoryListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0" data-testid="inventory-list-table">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <InventoryListHeader />
          <InventoryListDataTable />
        </>
      )}
    </Container>
  )
}
