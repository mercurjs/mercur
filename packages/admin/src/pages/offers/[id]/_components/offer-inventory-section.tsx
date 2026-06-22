import { Buildings } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { _DataTable } from "../../../../components/table/data-table"
import { PlaceholderCell } from "../../../../components/table/table-cells/common/placeholder-cell"
import { useDataTable } from "../../../../hooks/use-data-table"
import { OfferDetail, OfferInventoryItemLink } from "../../common/types"

type Props = { offer: OfferDetail }

type InventoryRow = {
  id: string
  title?: string | null
  sku?: string | null
  required_quantity?: number | null
  location_levels?: {
    available_quantity?: number | null
    stocked_quantity?: number | null
    reserved_quantity?: number | null
  }[] | null
}

const columnHelper = createColumnHelper<InventoryRow>()

const PAGE_SIZE = 20

const computeAvailable = (row: InventoryRow) => {
  const levels = row.location_levels ?? []
  let quantity = 0
  let locations = 0
  for (const level of levels) {
    if (level.available_quantity != null) {
      quantity += level.available_quantity
    } else {
      const stocked = level.stocked_quantity ?? 0
      const reserved = level.reserved_quantity ?? 0
      quantity += Math.max(0, stocked - reserved)
    }
    locations += 1
  }
  return { quantity, locations }
}

const InventoryActions = ({ item }: { item: InventoryRow }) => {
  const { t } = useTranslation()
  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <Buildings />,
              label: t("offers.detail.goToInventoryItem"),
              to: `/inventory/${item.id}`,
            },
          ],
        },
      ]}
    />
  )
}

export const OfferInventorySection = ({ offer }: Props) => {
  const { t } = useTranslation()

  const inventoryItems: InventoryRow[] = useMemo(() => {
    const links: OfferInventoryItemLink[] = offer.inventory_item_link ?? []
    return links
      .map((link) => {
        const item = link.inventory_item
        if (!item?.id) return null
        return {
          id: item.id,
          title: item.title,
          sku: item.sku,
          required_quantity: link.required_quantity,
          location_levels: item.location_levels,
        } satisfies InventoryRow
      })
      .filter((x): x is InventoryRow => x !== null)
  }, [offer.inventory_item_link])

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: t("fields.title"),
        cell: ({ getValue }) => {
          const title = getValue()
          if (!title) return <PlaceholderCell />
          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{title}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("sku", {
        header: t("offers.fields.sku"),
        cell: ({ getValue }) => {
          const sku = getValue()
          if (!sku) return <PlaceholderCell />
          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{sku}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("required_quantity", {
        header: t("offers.fields.requiredQuantity"),
        cell: ({ getValue }) => {
          const value = getValue()
          if (value == null) return <PlaceholderCell />
          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{value}</span>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "inventory",
        header: t("labels.available"),
        cell: ({ row }) => {
          const { quantity, locations } = computeAvailable(row.original)
          if (locations === 0) return <PlaceholderCell />
          const text = `${quantity} available at ${locations} ${
            locations === 1 ? "location" : "locations"
          }`
          return (
            <div className="flex size-full items-center overflow-hidden">
              <Text
                size="small"
                className={
                  quantity === 0 ? "text-ui-fg-error truncate" : "truncate"
                }
              >
                {text}
              </Text>
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <InventoryActions item={row.original} />,
      }),
    ],
    [t],
  )

  const { table } = useDataTable({
    data: inventoryItems,
    columns,
    count: inventoryItems.length,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  return (
    <Container
      className="divide-y p-0"
      data-testid="offer-detail-inventory-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.detail.inventoryItems")}</Heading>
      </div>

      {inventoryItems.length === 0 ? (
        <div className="px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            {t("offers.detail.noInventoryItems")}
          </Text>
        </div>
      ) : (
        <_DataTable
          table={table}
          columns={columns}
          pageSize={PAGE_SIZE}
          count={inventoryItems.length}
          navigateTo={(row) => `/inventory/${row.id}`}
        />
      )}
    </Container>
  )
}
