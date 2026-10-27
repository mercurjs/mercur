import type { ShippingZoneDTO } from "@mercurjs/types"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ListSummary } from "../../../../../components/common/list-summary"
import { _DataTable } from "../../../../../components/table/data-table"
import { StatusCell } from "../../../../../components/table/table-cells/common/status-cell"
import { TextCell } from "../../../../../components/table/table-cells/common/text-cell"
import { useShippingZones } from "../../../../../hooks/api/shipping-zones"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useQueryParams } from "../../../../../hooks/use-query-params"
import { getZoneCountrySummaries } from "../../../common/utils"
import { ShippingZoneRowActions } from "./shipping-zone-row-actions"

const PAGE_SIZE = 20

const columnHelper = createColumnHelper<ShippingZoneDTO>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => t("shippingZones.fields.name"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("code", {
        header: () => t("shippingZones.fields.code"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.display({
        id: "countries",
        header: () => t("shippingZones.fields.countries"),
        cell: ({ row }) => (
          <div className="flex h-full w-full items-center overflow-hidden">
            <ListSummary list={getZoneCountrySummaries(row.original, t)} n={3} />
          </div>
        ),
      }),
      columnHelper.accessor("is_active", {
        header: () => t("fields.status"),
        cell: ({ getValue }) =>
          getValue() ? (
            <StatusCell color="green">
              {t("shippingZones.status.active")}
            </StatusCell>
          ) : (
            <StatusCell color="grey">
              {t("shippingZones.status.inactive")}
            </StatusCell>
          ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <ShippingZoneRowActions zone={row.original} />,
      }),
    ],
    [t]
  )
}

export const ShippingZoneListDataTable = () => {
  const { t } = useTranslation()

  const raw = useQueryParams(["offset", "q", "order"])
  const searchParams = {
    limit: PAGE_SIZE,
    offset: raw.offset ? Number(raw.offset) : 0,
    ...(raw.q ? { q: raw.q } : {}),
    ...(raw.order ? { order: raw.order } : {}),
  }

  const { shipping_zones, count, isLoading, isError, error } =
    useShippingZones(searchParams, { placeholderData: keepPreviousData })

  const columns = useColumns()

  const { table } = useDataTable({
    columns,
    data: shipping_zones ?? [],
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
        { key: "name", label: t("shippingZones.fields.name") },
        { key: "code", label: t("shippingZones.fields.code") },
        { key: "created_at", label: t("fields.createdAt") },
      ]}
      navigateTo={({ original }) => `${original.id}/edit`}
      queryObject={raw}
      pagination
      search
    />
  )
}
