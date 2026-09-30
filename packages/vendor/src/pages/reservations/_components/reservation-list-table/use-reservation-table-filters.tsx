import { Filter } from "@components/table/data-table"
import { useStockLocations } from "@hooks/api/stock-locations"
import { useCan } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

export const useReservationTableFilters = () => {
  const { t } = useTranslation()
  const canViewLocations = useCan("stock_locations")
  const { stock_locations } = useStockLocations(
    {
      limit: 1000,
    },
    { enabled: canViewLocations }
  )

  const filters: Filter[] = []

  filters.push({
    type: "string",
    key: "sku",
    label: t("fields.sku"),
  })

  if (stock_locations && canViewLocations) {
    const stockLocationFilter: Filter = {
      type: "select",
      options: stock_locations.map((s) => ({
        label: s.name,
        value: s.id,
      })),
      key: "location_id",
      searchable: true,
      label: t("fields.location"),
    }

    filters.push(stockLocationFilter)
  }

  filters.push({
    type: "date",
    key: "created_at",
    label: t("fields.createdAt"),
  })

  return filters
}
