import { Filter } from "../../../../components/table/data-table"
import { useSellers } from "../../../../hooks/api/sellers"
import { useStockLocations } from "../../../../hooks/api/stock-locations"
import { useTranslation } from "react-i18next"

export const useInventoryTableFilters = () => {
  const { t } = useTranslation()
  const { stock_locations } = useStockLocations({
    limit: 1000,
  })
  const { sellers } = useSellers({ limit: 1000 })

  const filters: Filter[] = []

  filters.push({
    type: "string",
    key: "sku",
    label: t("fields.sku"),
  })

  if (sellers) {
    filters.push({
      type: "select",
      options: sellers.map((s) => ({
        label: s.name,
        value: s.id,
      })),
      key: "seller_id",
      searchable: true,
      label: t("inventory.store"),
    })
  }

  if (stock_locations) {
    filters.push({
      type: "select",
      options: stock_locations.map((s) => ({
        label: s.name,
        value: s.id,
      })),
      key: "location_id",
      searchable: true,
      label: t("fields.location"),
    })
  }

  filters.push({
    type: "number",
    key: "height",
    label: t("fields.height"),
  })

  filters.push({
    type: "number",
    key: "width",
    label: t("fields.width"),
  })

  filters.push({
    type: "string",
    key: "mid_code",
    label: t("fields.midCode"),
  })

  filters.push({
    type: "string",
    key: "material",
    label: t("fields.material"),
  })

  return filters
}
