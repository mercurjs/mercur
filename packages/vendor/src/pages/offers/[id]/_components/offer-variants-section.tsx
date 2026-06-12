import {
  Buildings,
  Component,
  CurrencyDollar,
  PencilSquare,
  Trash,
} from "@medusajs/icons"
import {
  Badge,
  clx,
  Container,
  createDataTableColumnHelper,
  type DataTableAction,
  Heading,
  toast,
  Tooltip,
  usePrompt,
} from "@medusajs/ui"
import { OfferDTO } from "@mercurjs/types"
import type { CellContext } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../components/common/action-menu"
import { Thumbnail } from "../../../../components/common/thumbnail"
import { DataTable } from "../../../../components/data-table"
import { useDataTableDateFilters } from "../../../../components/data-table/helpers/general/use-data-table-date-filters"
import { useBulkDeleteOffers } from "../../../../hooks/api/offers"
import { useDate } from "../../../../hooks/use-date"
import { useQueryParams } from "../../../../hooks/use-query-params"
import { OfferProductVariant } from "../../common/types"

const PAGE_SIZE = 10
const PREFIX = "ov"

/** The wrap attaches per-location stock under the offer's inventory link. */
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

/** One row per offer, carrying its parent variant for the shared columns. */
type OfferVariantRow = {
  /** The offer id — also the table row id, so `row.id` resolves it. */
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
    // More than one backing inventory item ⇒ the offer is an inventory
    // kit; the table marks it with a Component glyph (Figma `40016500:749885`).
    isKit: links.length > 1,
    available,
    locationCount: locations.size,
  }
}

/** Matches an ISO date against a `{ $gte, $lte }` filter value. */
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

const columnHelper = createDataTableColumnHelper<OfferVariantRow>()

const useColumns = ({
  optionTitles,
  thumbnail,
  getActions,
}: {
  optionTitles: string[]
  thumbnail?: string | null
  getActions: (
    ctx: CellContext<OfferVariantRow, unknown>,
  ) => DataTableAction<OfferVariantRow>[][]
}) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  return useMemo(
    () => [
      columnHelper.display({
        id: "thumbnail",
        header: "",
        // Variant-level images aren't carried by the `withOffers` wrap, so
        // every row falls back to the product thumbnail (Figma shows a
        // thumbnail in the Title cell, `40016500:747487`).
        cell: () => (
          <div className="flex items-center">
            <Thumbnail src={thumbnail ?? null} />
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.variant.title ?? "", {
        id: "title",
        header: t("fields.title"),
        enableSorting: true,
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
        cell: ({ getValue }) =>
          getValue() || <span className="text-ui-fg-muted">-</span>,
      }),
      columnHelper.accessor((row) => skuOf(row), {
        id: "sku",
        header: t("fields.sku"),
        enableSorting: true,
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
        cell: ({ getValue }) =>
          getValue() || <span className="text-ui-fg-muted">-</span>,
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
              <span className="text-ui-fg-muted">-</span>
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
            return <span className="text-ui-fg-muted">-</span>
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
      columnHelper.accessor((row) => row.offer.created_at, {
        id: "created_at",
        header: t("fields.createdAt"),
        enableSorting: true,
        sortAscLabel: t("filters.sorting.dateAsc"),
        sortDescLabel: t("filters.sorting.dateDesc"),
        cell: ({ getValue }) => {
          const date = getValue()
          if (!date) {
            return <span className="text-ui-fg-muted">-</span>
          }
          return (
            <Tooltip content={getFullDate({ date, includeTime: true })}>
              <span>{getFullDate({ date })}</span>
            </Tooltip>
          )
        },
      }),
      columnHelper.accessor((row) => row.offer.updated_at, {
        id: "updated_at",
        header: t("fields.updatedAt"),
        enableSorting: true,
        sortAscLabel: t("filters.sorting.dateAsc"),
        sortDescLabel: t("filters.sorting.dateDesc"),
        cell: ({ getValue }) => {
          const date = getValue()
          if (!date) {
            return <span className="text-ui-fg-muted">-</span>
          }
          return (
            <Tooltip content={getFullDate({ date, includeTime: true })}>
              <span>{getFullDate({ date })}</span>
            </Tooltip>
          )
        },
      }),
      columnHelper.action({ actions: getActions }),
    ],
    [t, optionTitles, thumbnail, getActions, getFullDate],
  )
}

/**
 * Variants table of the product-shaped offer detail (Figma
 * `40016489:640014` / `40016500:747473`). Mirrors the product detail's
 * variants table — search, sort (Title / SKU / Created / Updated), and
 * Created/Updated date filters — but is offer-scoped: one row per offer,
 * navigating to the offer-keyed variant detail `variants/:offer_id`.
 *
 * Reads come from the wrapped product graph (client-side), so search /
 * sort / filter / pagination are applied in memory against the offer
 * rows rather than re-fetched.
 */
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

  const getActions = useCallback(
    (
      ctx: CellContext<OfferVariantRow, unknown>,
    ): DataTableAction<OfferVariantRow>[][] => {
      const row = ctx.row.original
      return [
        [
          {
            icon: <PencilSquare />,
            label: t("actions.edit"),
            onClick: () => navigate(`variants/${row.id}/edit`),
          },
        ],
        [
          {
            icon: <Trash />,
            label: t("actions.delete"),
            onClick: () => handleDelete(row.offer.id, skuOf(row)),
          },
        ],
      ]
    },
    [navigate, handleDelete, t],
  )

  const columns = useColumns({ optionTitles, thumbnail, getActions })
  const filters = useDataTableDateFilters()

  // No `divide-y` on the Container: this section draws its own header, so the
  // DataTable renders only its filter bar, which already has a `border-t`. A
  // Container divider would stack a second line between the header and the
  // filter row; the filter bar owns that separator.
  return (
    <Container className="p-0" data-testid="offer-variants-section">
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
      <DataTable
        data={pageRows}
        columns={columns}
        filters={filters}
        getRowId={(row) => row.id}
        rowHref={(row) => `variants/${row.id}`}
        rowCount={sortedRows.length}
        pageSize={PAGE_SIZE}
        prefix={PREFIX}
        emptyState={{
          empty: {
            heading: t("offers.empty.heading"),
            description: t("offers.empty.description"),
          },
          filtered: {
            heading: t("offers.filtered.heading"),
            description: t("offers.filtered.description"),
          },
        }}
      />
    </Container>
  )
}
