import { Component } from "@medusajs/icons"
import { ExtendedAdminProduct, ExtendedAdminProductVariant } from "@custom-types/products"
import {
  Badge,
  clx,
  Container,
  Heading,
  Tooltip,
} from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { createColumnHelper } from "@tanstack/react-table"

import { _DataTable } from "@components/table/data-table"
import { useProductVariants } from "@hooks/api"
import { useProductVariantsTableQuery } from "@hooks/table/query/use-product-variants-table-query"
import { useDataTable } from "@hooks/use-data-table"
import { useProductDetailContext } from "../../context"

const PAGE_SIZE = 10

export const ProductVariantSection = () => {
  const { product } = useProductDetailContext()
  const { t } = useTranslation()
  const { id: productId } = useParams<{ id: string }>()

  const { searchParams, raw } = useProductVariantsTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { variants, count, isLoading } = useProductVariants(
    productId!,
    searchParams,
    {
      placeholderData: keepPreviousData,
      enabled: !!productId,
    }
  )

  const columns = useColumns(product)

  const { table } = useDataTable({
    data: variants || [],
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row?.id || "",
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.variants.header")}</Heading>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count || 0}
        pageSize={PAGE_SIZE}
        search
        pagination
        isLoading={isLoading}
        queryObject={raw}
        navigateTo={(row) => `variants/${row.original.id}`}
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "sku", label: t("fields.sku") },
        ]}
        noRecords={{
          title: t("products.variants.empty.heading"),
          message: t("products.variants.empty.description"),
          action: {
            to: "variants/create",
            label: t("actions.create"),
          },
        }}
      />
    </Container>
  )
}

const columnHelper = createColumnHelper<ExtendedAdminProductVariant>()

const useColumns = (product: ExtendedAdminProduct) => {
  const { t } = useTranslation()

  const optionColumns = useMemo(() => {
    if (!product?.options) {
      return []
    }

    return product.options.map((option) => {
      return columnHelper.display({
        id: option.id,
        header: option.title,
        cell: ({ row }) => {
          const variantOpt = row.original.options?.find(
            (opt) => opt.option_id === option.id
          )

          if (!variantOpt) {
            return <span className="text-ui-fg-muted">-</span>
          }

          return (
            <div className="flex items-center">
              <Tooltip content={variantOpt.value}>
                <Badge
                  size="2xsmall"
                  title={variantOpt.value}
                  className="inline-flex min-w-[20px] max-w-[140px] items-center justify-center overflow-hidden truncate"
                >
                  {variantOpt.value}
                </Badge>
              </Tooltip>
            </div>
          )
        },
      })
    })
  }, [product])

  const getInventory = useCallback(
    (variant: ExtendedAdminProductVariant) => {
      const inventoryItems = variant.inventory_items
        ?.map((i) => i.inventory)
        .filter(Boolean)

      const hasInventoryKit = inventoryItems ? inventoryItems.length > 1 : false

      const inventory = inventoryItems?.[0]
      const locationLevels = (inventory as any)?.location_levels ?? []

      const quantity =
        locationLevels.reduce(
          (acc: number, curr: any) => acc + (curr.available_quantity ?? 0),
          0
        ) || 0
      const locationCount = locationLevels.length || 0

      const text = hasInventoryKit
        ? t("products.variant.tableItemAvailable", {
            availableCount: quantity,
          })
        : t("products.variant.tableItem", {
            availableCount: quantity,
            locationCount,
            count: locationCount,
          })

      return { text, hasInventoryKit, quantity }
    },
    [t]
  )

  return useMemo(() => {
    return [
      columnHelper.accessor("title", {
        header: t("fields.title"),
        cell: ({ getValue }) => getValue() || "-",
      }),
      columnHelper.accessor("sku", {
        header: t("fields.sku"),
        cell: ({ getValue }) => getValue() || "-",
      }),
      ...optionColumns,
      columnHelper.display({
        id: "inventory",
        header: t("fields.inventory"),
        cell: ({ row }) => {
          const { text, hasInventoryKit, quantity } = getInventory(row.original)

          return (
            <Tooltip content={text}>
              <div className="flex h-full w-full items-center gap-2 overflow-hidden">
                {hasInventoryKit && <Component />}
                <span
                  className={clx("truncate", {
                    "text-ui-fg-error": !quantity,
                  })}
                >
                  {text}
                </span>
              </div>
            </Tooltip>
          )
        },
      }),
    ]
  }, [t, optionColumns, getInventory])
}
