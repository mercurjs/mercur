import { Component, Trash } from "@medusajs/icons"
import {
  Badge,
  clx,
  Container,
  Heading,
  toast,
  Tooltip,
  usePrompt,
} from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "../../../../components/common/action-menu"
import { Thumbnail } from "../../../../components/common/thumbnail"
import { _DataTable, Filter } from "../../../../components/table/data-table"
import { DataTableOrderByKey } from "../../../../components/table/data-table/data-table-order-by"
import { useBulkDeleteOffers } from "../../../../hooks/api/offers"
import { useDataTable } from "../../../../hooks/use-data-table"
import { useQueryParams } from "../../../../hooks/use-query-params"
import { OfferDTO } from "@mercurjs/types"
import { OfferProductVariant } from "../../common/types"

const PAGE_SIZE = 10
const PREFIX = "ov"

/**
 * The `withOffers` wrap attaches per-location stock under each offer's
 * inventory link (`inventory_item_link`), which is not part of the base
 * `OfferDTO` — extend it locally just for the inventory cell.
 */
type OfferWithInventory = OfferDTO & {
  inventory_item_link?: Array<{
    inventory_item?: {
      location_levels?: Array<{
        location_id?: string | null
        stocked_quantity?: number | null
      }> | null
    } | null
  }> | null
}

type OfferVariantRow = {
  // the offer id is also the table row id, so `row.id` resolves it
  id: string
  variant: OfferProductVariant
  offer: OfferWithInventory
}

const skuOf = (row: OfferVariantRow) => row.offer.sku ?? row.variant.sku ?? ""

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
    // More than one backing inventory item ⇒ the offer is an inventory kit.
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
  onDelete,
}: {
  optionTitles: string[]
  thumbnail?: string | null
  onDelete: (offerId: string, sku: string) => void
}) => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor((row) => row.variant.title ?? "", {
        id: "title",
        header: t("fields.title"),
        cell: ({ getValue }) => {
          const value = getValue()
          return (
            <div className="flex h-full w-[220px] items-center gap-x-3 overflow-hidden">
              <div className="w-fit flex-shrink-0">
                <Thumbnail src={thumbnail ?? null} />
              </div>
              {value ? (
                <span title={value} className="truncate">
                  {value}
                </span>
              ) : (
                <span className="text-ui-fg-muted">-</span>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor((row) => skuOf(row), {
        id: "sku",
        header: t("fields.sku"),
        cell: ({ getValue }) => {
          const value = getValue()
          return (
            <div className="w-[140px] truncate whitespace-nowrap">
              {value ? value : <span className="text-ui-fg-muted">-</span>}
            </div>
          )
        },
      }),
      ...optionTitles.map((title) =>
        columnHelper.display({
          id: `option-${title}`,
          header: title,
          cell: ({ row }) => {
            const opt = row.original.variant.options?.find(
              (o) => o.option?.title === title,
            )
            if (!opt?.value) {
              return (
                <div className="w-[120px]">
                  <span className="text-ui-fg-muted">-</span>
                </div>
              )
            }
            return (
              <div className="flex w-[120px] items-center gap-1">
                <Tooltip content={opt.value}>
                  <Badge
                    size="2xsmall"
                    title={opt.value}
                    className="inline-flex min-w-[20px] max-w-[140px] items-center justify-center overflow-hidden truncate"
                  >
                    {opt.value}
                  </Badge>
                </Tooltip>
              </div>
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
            return (
              <div className="w-[160px]">
                <span className="text-ui-fg-muted">-</span>
              </div>
            )
          }
          const text = t("products.variant.tableItem", {
            availableCount: available,
            locationCount,
            count: locationCount,
          })
          return (
            <Tooltip content={text}>
              <div className="flex h-full w-[160px] items-center gap-2 overflow-hidden">
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
        cell: ({ row }) => (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <Trash />,
                    label: t("actions.delete"),
                    onClick: () =>
                      onDelete(row.original.offer.id, skuOf(row.original)),
                  },
                ],
              },
            ]}
          />
        ),
      }),
    ],
    [t, optionTitles, thumbnail, onDelete],
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
        return (
          title.includes(search) || skuOf(row).toLowerCase().includes(search)
        )
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
    if (!order) {
      return filteredRows
    }
    const desc = order.startsWith("-")
    const key = desc ? order.slice(1) : order

    const valueOf = (row: OfferVariantRow): string => {
      switch (key) {
        case "title":
          return row.variant.title ?? ""
        case "sku":
          return skuOf(row)
        case "created_at":
          return row.offer.created_at
            ? new Date(row.offer.created_at).toISOString()
            : ""
        case "updated_at":
          return row.offer.updated_at
            ? new Date(row.offer.updated_at).toISOString()
            : ""
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

  const columns = useColumns({ optionTitles, thumbnail, onDelete: handleDelete })
  const filters = useFilters()
  const orderBy = useOrderBy()

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
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={sortedRows.length}
        pageSize={PAGE_SIZE}
        filters={filters}
        search
        pagination
        orderBy={orderBy}
        prefix={PREFIX}
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

const useFilters = (): Filter[] => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      { key: "created_at", label: t("fields.createdAt"), type: "date" },
      { key: "updated_at", label: t("fields.updatedAt"), type: "date" },
    ],
    [t],
  )
}

const useOrderBy = (): DataTableOrderByKey<OfferVariantRow>[] => {
  const { t } = useTranslation()

  // Sort keys map to the nested `variant`/`offer` fields read by the
  // in-memory sort above, not to row-level keys — cast past the
  // `keyof OfferVariantRow` constraint.
  return useMemo(
    () =>
      [
        { key: "title", label: t("fields.title") },
        { key: "sku", label: t("fields.sku") },
      ] as unknown as DataTableOrderByKey<OfferVariantRow>[],
    [t],
  )
}
