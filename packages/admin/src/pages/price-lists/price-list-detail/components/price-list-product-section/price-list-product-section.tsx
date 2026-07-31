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
import { usePriceListLinkProducts } from "../../../../../hooks/api/price-lists"
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

  const variantIds = useMemo(
    () =>
      Array.from(
        new Set(
          (priceList.prices ?? [])
            .map((price) => price.variant_id)
            .filter(Boolean)
        )
      ),
    [priceList.prices]
  )

  const { searchParams, raw } = useOfferTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })
  const { offers, count, isLoading, isError, error } = useOffers(
    { ...searchParams, variant_id: variantIds },
    {
      placeholderData: keepPreviousData,
      enabled: variantIds.length > 0,
    }
  )

  const offerToProduct = useRef<Record<string, string>>({})
  for (const offer of (offers ?? []) as OfferDTO[]) {
    offerToProduct.current[offer.id] = offer.product_id
  }

  const selectedProductIds = () =>
    Array.from(
      new Set(
        Object.keys(rowSelection)
          .map((offerId) => offerToProduct.current[offerId])
          .filter(Boolean)
      )
    )

  const columns = useColumns(priceList)
  const filters = useOfferTableFilters()
  const { mutateAsync } = usePriceListLinkProducts(priceList.id)

  const { table } = useDataTable({
    data: (offers ?? []) as OfferDTO[],
    count,
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
                    disabled: count === 0,
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
          count={count}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          navigateTo={(row) => `/products/${row.original.product_id}`}
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
