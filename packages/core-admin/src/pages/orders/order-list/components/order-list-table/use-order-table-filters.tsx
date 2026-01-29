import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { createDataTableFilterHelper } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useDataTableDateFilters } from "../../../../../components/data-table/helpers/general/use-data-table-date-filters"
import { useRegions } from "../../../../../hooks/api/regions"
import { useSalesChannels } from "../../../../../hooks/api/sales-channels"

const filterHelper = createDataTableFilterHelper<HttpTypes.AdminOrder>()

/**
 * Hook to create filters in the format expected by @medusajs/ui DataTable
 */
export const useOrderTableFilters = () => {
  const { t } = useTranslation()
  const dateFilters = useDataTableDateFilters()

  const { regions } = useRegions({
    limit: 1000,
    fields: "id,name",
  })

  const { sales_channels } = useSalesChannels({
    limit: 1000,
    fields: "id,name",
  })

  return useMemo(() => {
    const filters = [...dateFilters]

    if (regions?.length) {
      filters.push(
        filterHelper.accessor("region_id", {
          label: t("fields.region"),
          type: "multiselect",
          options: regions.map((r) => ({
            label: r.name,
            value: r.id,
          })),
        })
      )
    }

    if (sales_channels?.length) {
      filters.push(
        filterHelper.accessor("sales_channel_id", {
          label: t("fields.salesChannel"),
          type: "multiselect",
          options: sales_channels.map((s) => ({
            label: s.name,
            value: s.id,
          })),
        })
      )
    }

    // TODO: Add payment and fulfillment status filters when they are properly linked to orders
    // Note: These filters are commented out in the legacy implementation as well

    return filters
  }, [regions, sales_channels, dateFilters, t])
}