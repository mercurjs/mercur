import { Buildings, Component, CurrencyDollar, PencilSquare, Trash } from "@medusajs/icons"
import {
  Badge,
  clx,
  Container,
  Heading,
  toast,
  Tooltip,
  usePrompt,
} from "@medusajs/ui"
import { OfferDTO } from "@mercurjs/types"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../components/common/action-menu"
import { Thumbnail } from "../../../../components/common/thumbnail"
import { _DataTable, Filter } from "../../../../components/table/data-table"
import { DataTableOrderByKey } from "../../../../components/table/data-table/data-table-order-by"
import { PlaceholderCell } from "../../../../components/table/table-cells/common/placeholder-cell"
import { useBulkDeleteOffers } from "../../../../hooks/api/offers"
import { useDataTable } from "../../../../hooks/use-data-table"
import { useQueryParams } from "../../../../hooks/use-query-params"
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"

import { OfferProductVariant } from "../../common/types"

const PAGE_SIZE = 10
const PREFIX = "ov"

type OfferWithInventory = OfferDTO & {
  inventory_item_link?: Array<{
    inventory_item?: {
      id?: string | null
      location_levels?: Array<{
        location_id?: string | null
        stocked_quantity?: number | null
      }> | null
    } | null
  }> | null
}

type OfferVariantRow = {
  id: string
  variant: OfferProductVariant
  offer: OfferWithInventory
}

const skuOf = (row: OfferVariantRow) => row.offer.sku ?? row.variant.sku ?? ""

const inventoryItemIdOf = (offer: OfferWithInventory) =>
  offer.inventory_item_link?.find((link) => link.inventory_item?.id)?.inventory_item
    ?.id ?? null

const inventoryOf = (offer: OfferWithInventory) => {
  const links = offer.inventory_item_link ?? []
  let available = 0
  const locations = new Set<string>()
  for (const link of links) {
    for (const level of link.inventory_item?.location_levels ?? []) {
      available += level.stocked_quantity ?? 0
      if (level.location_id) {
        locations.add(level.location_id)
      }
    }
  }
  return {
    hasItems: links.length > 0,
    isKit: links.length > 1,
    available,
    locationCount: locations.size,
  }
}

const matchesDateFilter = (
  value: string | Date | null | undefined,
  filter: { $gte?: string; $lte?: string },
) => {
  if (!value) {
    return false
  }
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) {
    return false
  }
  if (filter.$gte && time < new Date(filter.$gte).getTime()) {
    return false
  }
  if (filter.$lte && time > new Date(filter.$lte).getTime()) {
    return false
  }
  return true
}

const columnHelper = createColumnHelper<OfferVariantRow>()

const useColumns = ({
  optionTitles,
  thumbnail,
  onEdit,
  onDelete,
}: {
  optionTitles: string[]
  thumbnail?: string | null
  onEdit: (offerId: string) => void
  onDelete: (offerId: string, sku: string) => void
}) => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor((row) => row.variant.title ?? "", {
        id: "title",
        header: t("fields.title"),
        cell: ({ getValue }) => (
          <div className="flex h-full w-full max-w-[250px] items-center gap-x-3 overflow-hidden">
            <div className="w-fit flex-shrink-0">
              <Thumbnail src={thumbnail ?? null} />
            </div>
            {getValue() ? (
              <span title={getValue()} className="truncate">
                {getValue()}
              </span>
            ) : (
              <span className="text-ui-fg-muted">-</span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor((row) => skuOf(row), {
        id: "sku",
        header: t("fields.sku"),
        cell: ({ getValue }) =>
          getValue() ? (
            <span title={getValue()} className="truncate">
              {getValue()}
            </span>
          ) : (
            <PlaceholderCell />
          ),
      }),
      ...optionTitles.map((title) =>
        columnHelper.display({
          id: `option-${title}`,
          header: title,
          cell: ({ row }) => {
            const opt = row.original.variant.options?.find(
              (o) => o.option?.title === title,
            )
            return opt?.value ? (
              <Badge size="2xsmall">{opt.value}</Badge>
            ) : (
              <PlaceholderCell />
            )
          },
        }),
      ),
      columnHelper.display({
        id: "inventory",
        header: t("fields.inventory"),
        cell: ({ row }) => {
          const { hasItems, isKit, available, locationCount } = inventoryOf(
            row.original.offer,
          )
          if (!hasItems) {
            return <PlaceholderCell />
          }
          const text = t("products.variant.tableItem", {
            availableCount: available,
            locationCount,
            count: locationCount,
          })
          return (
            <Tooltip content={text}>
              <div className="flex h-full w-full items-center gap-2 overflow-hidden">
                {isKit && <Component className="text-ui-fg-subtle" />}
                <span
                  className={clx("truncate", {
                    "text-ui-fg-error": available === 0,
                  })}
                >
                  {text}
                </span>
              </div>
            </Tooltip>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const inventoryItemId = inventoryItemIdOf(row.original.offer)
          return (
            <ActionMenu
              groups={[
                {
                  actions: [
                    {
                      icon: <PencilSquare />,
                      label: t("actions.edit"),
                      onClick: () => onEdit(row.original.id),
                    },
                    inventoryItemId
                      ? {
                          icon: <Buildings />,
                          label: t("offers.detail.goToInventoryItem"),
                          to: `/inventory/${inventoryItemId}`,
                        }
                      : {
                          icon: <Buildings />,
                          label: t("offers.detail.goToInventoryItem"),
                          onClick: () => {},
                          disabled: true,
                          disabledTooltip: t("offers.detail.noInventoryItems"),
                        },
                  ],
                },
                {
                  actions: [
                    {
                      icon: <Trash />,
                      label: t("actions.delete"),
                      onClick: () =>
                        onDelete(row.original.id, skuOf(row.original)),
                    },
                  ],
                },
              ]}
            />
          )
        },
      }),
    ],
    [t, optionTitles, thumbnail, onEdit, onDelete],
  )
}

export const OfferVariantsSection = ({
  variants,
  thumbnail,
}: {
  variants?: OfferProductVariant[] | null
  thumbnail?: string | null
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()
  const { mutateAsync: bulkDelete } = useBulkDeleteOffers()

  const { q, order, offset, created_at, updated_at } = useQueryParams(
    ["q", "order", "offset", "created_at", "updated_at"],
    PREFIX,
  )

  const allRows: OfferVariantRow[] = useMemo(
    () =>
      (variants ?? []).flatMap((variant) =>
        (variant.offers ?? []).map((offer) => ({
          id: offer.id,
          variant,
          offer: offer as OfferWithInventory,
        })),
      ),
    [variants],
  )

  const optionTitles = useMemo(() => {
    const set = new Set<string>()
    for (const variant of variants ?? []) {
      for (const opt of variant.options ?? []) {
        if (opt.option?.title) {
          set.add(opt.option.title)
        }
      }
    }
    return Array.from(set)
  }, [variants])

  const filteredRows = useMemo(() => {
    let rows = allRows

    const search = q?.trim().toLowerCase()
    if (search) {
      rows = rows.filter((row) => {
        const title = (row.variant.title ?? "").toLowerCase()
        return title.includes(search) || skuOf(row).toLowerCase().includes(search)
      })
    }

    const createdFilter = created_at
      ? (JSON.parse(created_at) as { $gte?: string; $lte?: string })
      : null
    if (createdFilter) {
      rows = rows.filter((row) =>
        matchesDateFilter(row.offer.created_at, createdFilter),
      )
    }

    const updatedFilter = updated_at
      ? (JSON.parse(updated_at) as { $gte?: string; $lte?: string })
      : null
    if (updatedFilter) {
      rows = rows.filter((row) =>
        matchesDateFilter(row.offer.updated_at, updatedFilter),
      )
    }

    return rows
  }, [allRows, q, created_at, updated_at])

  const sortedRows = useMemo(() => {
    const activeOrder = order || "title"
    const desc = activeOrder.startsWith("-")
    const key = desc ? activeOrder.slice(1) : activeOrder

    const valueOf = (row: OfferVariantRow): string => {
      switch (key) {
        case "title":
          return row.variant.title ?? ""
        case "sku":
          return skuOf(row)
        case "created_at":
          return row.offer.created_at ? new Date(row.offer.created_at).toISOString() : ""
        case "updated_at":
          return row.offer.updated_at ? new Date(row.offer.updated_at).toISOString() : ""
        default:
          return ""
      }
    }

    const sorted = [...filteredRows].sort((a, b) =>
      valueOf(a).localeCompare(valueOf(b)),
    )
    return desc ? sorted.reverse() : sorted
  }, [filteredRows, order])

  const pageIndex = offset ? Math.floor(parseInt(offset) / PAGE_SIZE) : 0
  const pageRows = useMemo(
    () => sortedRows.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE),
    [sortedRows, pageIndex],
  )

  const handleEdit = useCallback(
    (offerId: string) => navigate(`variants/${offerId}/edit`),
    [navigate],
  )

  const handleDelete = useCallback(
    async (offerId: string, sku: string) => {
      const confirmed = await prompt({
        title: t("general.areYouSure"),
        description: t("offers.delete.description", { sku: sku || "-" }),
        confirmText: t("actions.delete"),
        cancelText: t("actions.cancel"),
        variant: "danger",
      })

      if (!confirmed) {
        return
      }

      const result = await bulkDelete([offerId])
      if (result.failed.length === 0) {
        toast.success(t("offers.delete.successToast"))
      } else {
        toast.error(result.failed[0]?.error.message)
      }
    },
    [prompt, bulkDelete, t],
  )

  const columns = useColumns({
    optionTitles,
    thumbnail,
    onEdit: handleEdit,
    onDelete: handleDelete,
  })

  const orderBy = useMemo(
    () =>
      [
        { key: "title", label: t("fields.title") },
        { key: "sku", label: t("fields.sku") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ] as DataTableOrderByKey<OfferVariantRow>[],
    [t],
  )

  const filters = useMemo<Filter[]>(
    () => [
      { key: "created_at", label: t("fields.createdAt"), type: "date" },
      { key: "updated_at", label: t("fields.updatedAt"), type: "date" },
    ],
    [t],
  )

  const { table } = useDataTable({
    data: pageRows,
    columns,
    count: sortedRows.length,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
    prefix: PREFIX,
  })

  return (
    <Container className="divide-y p-0" data-testid="offer-variants-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.fields.variants")}</Heading>
        <div className="flex items-center gap-x-4">
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("offers.actions.edit_prices"),
                    icon: <CurrencyDollar />,
                    to: "edit-price",
                  },
                  {
                    label: t("offers.actions.edit_stock_levels"),
                    icon: <Buildings />,
                    to: "edit-stock",
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={sortedRows.length}
        pageSize={PAGE_SIZE}
        prefix={PREFIX}
        pagination
        search
        orderBy={orderBy}
        defaultOrderBy="title"
        filters={filters}
        queryObject={{ q, order, created_at, updated_at }}
        navigateTo={(row) => `variants/${row.original.id}`}
        noRecords={{
          title: t("offers.empty.heading"),
          message: t("offers.empty.description"),
        }}
      />
      <DisplayExtensionZone model="offer" zone="variants" data={variants} />
    </Container>
  )
}
