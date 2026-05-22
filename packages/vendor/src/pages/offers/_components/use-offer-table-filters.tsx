import { useTranslation } from "react-i18next"

import { Filter } from "../../../components/table/data-table"
import { useShippingProfiles } from "../../../hooks/api/shipping-profiles"

export const useOfferTableFilters = () => {
  const { t } = useTranslation()
  const { shipping_profiles } = useShippingProfiles({ limit: 1000 })

  const filters: Filter[] = []

  if (shipping_profiles && shipping_profiles.length > 0) {
    filters.push({
      type: "select",
      key: "shipping_profile_id",
      label: t("shippingProfile.domain"),
      multiple: true,
      searchable: true,
      options: shipping_profiles.map((p) => ({
        label: p.name ?? p.id,
        value: p.id,
      })),
    })
  }

  filters.push({
    type: "string",
    key: "sku",
    label: t("offers.fields.sku"),
  })

  filters.push({
    type: "date",
    key: "created_at",
    label: t("fields.createdAt"),
  })

  filters.push({
    type: "date",
    key: "updated_at",
    label: t("fields.updatedAt"),
  })

  return filters
}
