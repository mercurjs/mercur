import type { MarketplaceShippingMethodDTO } from "@mercurjs/types"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../../../components/table/data-table"
import { StatusCell } from "../../../../../components/table/table-cells/common/status-cell"
import { TextCell } from "../../../../../components/table/table-cells/common/text-cell"
import { useShippingMethods } from "../../../../../hooks/api/shipping-methods"
import { useShippingOptionTypes } from "../../../../../hooks/api/shipping-option-types"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useQueryParams } from "../../../../../hooks/use-query-params"
import { formatProvider } from "../../../../../lib/format-provider"
import { ShippingMethodRowActions } from "./shipping-method-row-actions"

const PAGE_SIZE = 20

const columnHelper = createColumnHelper<MarketplaceShippingMethodDTO>()

const useColumns = () => {
  const { t } = useTranslation()

  const { shipping_option_types } = useShippingOptionTypes({ limit: 1000 })

  return useMemo(() => {
    const optionTypeLabels = new Map(
      (shipping_option_types ?? []).map((type) => [type.id, type.label])
    )

    return [
      columnHelper.accessor("name", {
        header: () => t("shippingMethods.fields.name"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("code", {
        header: () => t("shippingMethods.fields.code"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("provider_id", {
        header: () => t("shippingMethods.fields.provider"),
        cell: ({ getValue }) => <TextCell text={formatProvider(getValue())} />,
      }),
      columnHelper.accessor("shipping_option_type_id", {
        header: () => t("shippingMethods.fields.optionType"),
        cell: ({ getValue }) => (
          <TextCell text={optionTypeLabels.get(getValue()) ?? getValue()} />
        ),
      }),
      columnHelper.accessor("cutoff_time", {
        header: () => t("shippingMethods.fields.cutoffTimeColumn"),
        cell: ({ getValue }) => <TextCell text={getValue() ?? undefined} />,
      }),
      columnHelper.accessor("is_active", {
        header: () => t("fields.status"),
        cell: ({ getValue }) =>
          getValue() ? (
            <StatusCell color="green">
              {t("shippingMethods.status.active")}
            </StatusCell>
          ) : (
            <StatusCell color="grey">
              {t("shippingMethods.status.inactive")}
            </StatusCell>
          ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <ShippingMethodRowActions method={row.original} />,
      }),
    ]
  }, [t, shipping_option_types])
}

export const ShippingMethodListDataTable = () => {
  const { t } = useTranslation()

  const raw = useQueryParams(["offset", "q", "order"])
  const searchParams = {
    limit: PAGE_SIZE,
    offset: raw.offset ? Number(raw.offset) : 0,
    ...(raw.q ? { q: raw.q } : {}),
    ...(raw.order ? { order: raw.order } : {}),
  }

  const { shipping_methods, count, isLoading, isError, error } =
    useShippingMethods(searchParams, { placeholderData: keepPreviousData })

  const columns = useColumns()

  const { table } = useDataTable({
    columns,
    data: shipping_methods ?? [],
    count,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      isLoading={isLoading}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={count}
      orderBy={[
        { key: "name", label: t("shippingMethods.fields.name") },
        { key: "code", label: t("shippingMethods.fields.code") },
        { key: "created_at", label: t("fields.createdAt") },
      ]}
      navigateTo={({ original }) => `${original.id}/edit`}
      queryObject={raw}
      pagination
      search
    />
  )
}
