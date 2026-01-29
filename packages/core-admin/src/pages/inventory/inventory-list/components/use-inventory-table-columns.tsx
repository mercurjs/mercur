import { InventoryTypes, ProductVariantDTO } from "@medusajs/types"

import { Checkbox } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { PlaceholderCell } from "../../../../components/table/table-cells/common/placeholder-cell"
import { InventoryActions } from "./inventory-actions"

/**
 * Adds missing properties to the InventoryItemDTO type.
 */
interface ExtendedInventoryItem extends InventoryTypes.InventoryItemDTO {
  variants?: ProductVariantDTO[] | null
  stocked_quantity?: number
  reserved_quantity?: number
}

const columnHelper = createColumnHelper<ExtendedInventoryItem>()

export const useInventoryTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => {
          return (
            <Checkbox
              checked={
                table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              data-testid="inventory-table-header-select-checkbox"
            />
          )
        },
        cell: ({ row }) => {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation()
              }}
              data-testid={`inventory-table-cell-${row.id}-select-checkbox`}
            />
          )
        },
      }),
      columnHelper.accessor("title", {
        header: () => (
          <div className="flex h-full w-full items-center" data-testid="inventory-table-header-title">
            <span data-testid="inventory-table-header-title-text">{t("fields.title")}</span>
          </div>
        ),
        cell: ({ getValue, row }) => {
          const title = getValue()

          if (!title) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex size-full items-center overflow-hidden">
              <span
                className="truncate"
                data-testid={`inventory-table-cell-${row.id}-title-value`}
              >
                {title}
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor("sku", {
        header: () => (
          <div className="flex h-full w-full items-center" data-testid="inventory-table-header-sku">
            <span data-testid="inventory-table-header-sku-text">{t("fields.sku")}</span>
          </div>
        ),
        cell: ({ getValue, row }) => {
          const sku = getValue() as string

          if (!sku) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex size-full items-center overflow-hidden">
              <span
                className="truncate"
                data-testid={`inventory-table-cell-${row.id}-sku-value`}
              >
                {sku}
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor("reserved_quantity", {
        header: () => (
          <div className="flex h-full w-full items-center" data-testid="inventory-table-header-reserved-quantity">
            <span data-testid="inventory-table-header-reserved-quantity-text">{t("inventory.reserved")}</span>
          </div>
        ),
        cell: ({ getValue, row }) => {
          const quantity = getValue()

          if (Number.isNaN(quantity)) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex size-full items-center overflow-hidden">
              <span
                className="truncate"
                data-testid={`inventory-table-cell-${row.id}-reserved_quantity-value`}
              >
                {quantity}
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor("stocked_quantity", {
        header: () => (
          <div className="flex h-full w-full items-center" data-testid="inventory-table-header-stocked-quantity">
            <span data-testid="inventory-table-header-stocked-quantity-text">{t("fields.inStock")}</span>
          </div>
        ),
        cell: ({ getValue, row }) => {
          const quantity = getValue()

          if (Number.isNaN(quantity)) {
            return <PlaceholderCell />
          }

          return (
            <div className="flex size-full items-center overflow-hidden">
              <span
                className="truncate"
                data-testid={`inventory-table-cell-${row.id}-stocked_quantity-value`}
              >
                {quantity}
              </span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => (
          <div className="flex h-full w-full items-center" data-testid="inventory-table-header-actions">
            <span data-testid="inventory-table-header-actions-text"></span>
          </div>
        ),
        cell: ({ row }) => <InventoryActions item={row.original} />,
      }),
    ],
    [t]
  )
}
