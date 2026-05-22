import { useTranslation } from "react-i18next"

import { Filter } from "../../../components/table/data-table"
import { useSellers } from "../../../hooks/api/sellers"
import { useShippingProfiles } from "../../../hooks/api/shipping-profiles"

export const useOfferTableFilters = (): Filter[] => {
  const { t } = useTranslation()
  const { sellers } = useSellers({ limit: 1000 })
  const { shipping_profiles } = useShippingProfiles({ limit: 1000 })

  const filters: Filter[] = []

  if (sellers && sellers.length > 0) {
    filters.push({
      type: "select",
      key: "seller_id",
      label: t("offers.fields.store"),
      multiple: true,
      searchable: true,
      options: sellers.map((s: { id: string; name?: string | null }) => ({
        label: s.name ?? s.id,
        value: s.id,
      })),
    })
  }

  if (shipping_profiles && shipping_profiles.length > 0) {
    filters.push({
      type: "select",
      key: "shipping_profile_id",
      label: t("shippingProfile.domain"),
      multiple: true,
      searchable: true,
      options: shipping_profiles.map(
        (p: { id: string; name?: string | null }) => ({
          label: p.name ?? p.id,
          value: p.id,
        }),
      ),
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
