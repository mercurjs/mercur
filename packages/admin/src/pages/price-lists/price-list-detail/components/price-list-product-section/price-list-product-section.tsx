import {
  EllipsisHorizontal,
  ExclamationCircle,
  PencilSquare,
  Trash,
} from "@medusajs/icons"
import type { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import {
  ColumnDef,
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import { OfferDTO } from "@mercurjs/types"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import {
  usePriceList,
  usePriceListLinkProducts,
} from "../../../../../hooks/api/price-lists"
import { useOffers } from "../../../../../hooks/api/offers"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useOfferTableColumns } from "../../../../offers/_components/use-offer-table-columns"
import { useOfferTableFilters } from "../../../../offers/_components/use-offer-table-filters"
import { useOfferTableQuery } from "../../../../offers/_components/use-offer-table-query"

type PriceListProductSectionProps = {
  priceList: HttpTypes.AdminPriceList
}

const PAGE_SIZE = 10
const PREFIX = "p"

export const PriceListProductSection = ({
  priceList,
}: PriceListProductSectionProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // The detail route doesn't populate prices by default (and a price has no
  // variant_id), so fetch the price rules explicitly to get the offer ids that
  // this price list targets.
  const { price_list: pricedList } = usePriceList(priceList.id, {
    fields: "id,+prices.price_rules.attribute,+prices.price_rules.value",
  })

  const offerIds = useMemo(() => {
    const ids = new Set<string>()
    for (const price of pricedList?.prices ?? []) {
      const offerId = (price as { rules?: Record<string, string> }).rules
        ?.offer_id
      if (offerId) {
        ids.add(offerId)
      }
    }
    return Array.from(ids)
  }, [pricedList])

  const { searchParams, raw } = useOfferTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })
  // Fetch ALL the price list's offers (ungrouped) so the client-side grouping by
  // store+product is complete; pagination then happens over the grouped rows.
  const { group_by_seller: _grouped, ...ungroupedParams } =
    searchParams as Record<string, unknown>
  const { offers, isLoading, isError, error } = useOffers(
    { ...ungroupedParams, id: offerIds, limit: offerIds.length || 1, offset: 0 },
    {
      placeholderData: keepPreviousData,
      enabled: offerIds.length > 0,
    }
  )

  // One row per (store, product); the Variants column shows how many of that
  // store's variants are in this price list.
  const groupedOffers = useMemo(() => {
    const groups = new Map<string, OfferDTO>()
    for (const offer of (offers ?? []) as OfferDTO[]) {
      const key = `${offer.seller_id}:${offer.product_id}`
      const existing = groups.get(key)
      if (existing) {
        existing.variant_count = (existing.variant_count ?? 0) + 1
        ;(existing.offer_ids ??= []).push(offer.id)
      } else {
        groups.set(key, {
          ...offer,
          id: key,
          variant_count: 1,
          offer_ids: [offer.id],
        })
      }
    }
    return Array.from(groups.values())
  }, [offers])

  const groupToProduct = useRef<Record<string, string>>({})
  for (const group of groupedOffers) {
    groupToProduct.current[group.id] = group.product_id
  }

  const selectedProductIds = () =>
    Array.from(
      new Set(
        Object.keys(rowSelection)
          .map((groupId) => groupToProduct.current[groupId])
          .filter(Boolean)
      )
    )

  const columns = useColumns(priceList)
  const filters = useOfferTableFilters()
  const { mutateAsync } = usePriceListLinkProducts(priceList.id)

  const { table } = useDataTable({
    data: groupedOffers,
    count: groupedOffers.length,
    columns,
    enablePagination: true,
    enableRowSelection: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
    rowSelection: {
      state: rowSelection,
      updater: setRowSelection,
    },
    prefix: PREFIX,
  })

  const handleDelete = async () => {
    const productIds = selectedProductIds()

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("priceLists.products.delete.confirmation", {
        count: productIds.length,
      }),
      confirmText: t("actions.remove"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    mutateAsync(
      { remove: productIds },
      {
        onSuccess: () => {
          toast.success(
            t("priceLists.products.delete.successToast", {
              count: productIds.length,
            })
          )
          setRowSelection({})
        },
        onError: (e) => toast.error(e.message),
      }
    )
  }

  const handleEdit = async () => {
    const ids = selectedProductIds().join(",")
    navigate(`products/edit?ids[]=${ids}`)
  }

  return (
    <Container className="divide-y p-0" data-testid="price-list-product-section-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="price-list-product-section-header">
        <Heading data-testid="price-list-product-section-heading">{t("priceLists.products.header")}</Heading>
        <div className="flex items-center gap-x-2">
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("priceLists.products.actions.editPrices"),
                    to: "products/edit",
                    icon: <PencilSquare />,
                    disabled: groupedOffers.length === 0,
                    disabledTooltip: t("priceLists.products.actions.editPricesDisabled"),
                  },
                ],
              },
            ]}
            data-testid="price-list-product-section-action-menu"
          >
            <Button size="small" variant="secondary" className="h-7 w-7 p-0" data-testid="price-list-product-section-action-menu-trigger">
              <EllipsisHorizontal />
            </Button>
          </ActionMenu>
          <Button size="small" variant="secondary" asChild data-testid="price-list-product-section-add-button">
            <Link to="products/add">{t("actions.add")}</Link>
          </Button>
        </div>
      </div>
      {isError ? (
        <div className="flex items-center gap-x-2 px-6 py-4" data-testid="price-list-product-section-error">
          <ExclamationCircle className="text-ui-fg-subtle" />
          <Text size="small" className="text-ui-fg-subtle">
            {error?.message || t("general.error")}
          </Text>
        </div>
      ) : (
        <_DataTable
          table={table}
          filters={filters}
          columns={columns}
          count={groupedOffers.length}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          navigateTo={(row) =>
            `/offers/${row.original.product_id}?seller_id=${row.original.seller_id}`
          }
          orderBy={[
            { key: "created_at", label: t("fields.createdAt") },
            { key: "updated_at", label: t("fields.updatedAt") },
          ]}
          defaultOrder="-created_at"
          commands={[
            {
              action: handleEdit,
              label: t("priceLists.products.actions.editPrices"),
              shortcut: "e",
            },
            {
              action: handleDelete,
              label: t("actions.remove"),
              shortcut: "r",
            },
          ]}
          pagination
          search
          prefix={PREFIX}
          queryObject={raw}
          data-testid="price-list-product-section-table"
        />
      )}
      <DisplayExtensionZone model="price_list" zone="products" data={priceList} />
    </Container>
  )
}

const OfferRowAction = ({
  offer,
  priceList,
}: {
  offer: OfferDTO
  priceList: HttpTypes.AdminPriceList
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = usePriceListLinkProducts(priceList.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("priceLists.products.delete.confirmation", { count: 1 }),
      confirmText: t("actions.remove"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    mutateAsync(
      { remove: [offer.product_id] },
      {
        onSuccess: () => {
          toast.success(
            t("priceLists.products.delete.successToast", { count: 1 })
          )
        },
        onError: (e) => toast.error(e.message),
      }
    )
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("priceLists.products.actions.editPrices"),
              to: `products/edit?ids[]=${offer.product_id}`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.remove"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<OfferDTO>()

const useColumns = (priceList: HttpTypes.AdminPriceList) => {
  const base = useOfferTableColumns()

  return useMemo(
    () => [
      ...(base.slice(0, -1) as ColumnDef<OfferDTO>[]),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <OfferRowAction offer={row.original} priceList={priceList} />
        ),
      }) as ColumnDef<OfferDTO>,
    ],
    [base, priceList]
  )
}
