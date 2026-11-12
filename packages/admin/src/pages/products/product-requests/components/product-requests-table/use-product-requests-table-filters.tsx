import { usePermissions } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import { Filter } from "../../../../../components/table/data-table"
import { useSellers } from "../../../../../hooks/api/sellers"
import { REQUEST_TYPES } from "../../../common/requests"

export const useProductRequestsTableFilters = (): Filter[] => {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { sellers } = useSellers({ limit: 1000 }, { enabled: can("sellers") })

  const filters: Filter[] = [
    {
      type: "select",
      key: "type",
      label: t("products.requests.fields.type"),
      multiple: true,
      options: REQUEST_TYPES.map((type) => ({
        label: t(`products.requests.types.${type}`),
        value: type,
      })),
    },
  ]

  if (sellers && sellers.length > 0) {
    filters.push({
      type: "select",
      key: "seller_id",
      label: t("products.requests.fields.store"),
      multiple: true,
      searchable: true,
      options: sellers.map((s: { id: string; name?: string | null }) => ({
        label: s.name ?? s.id,
        value: s.id,
      })),
    })
  }

  filters.push(
    { type: "date", key: "created_at", label: t("fields.createdAt") },
    { type: "date", key: "updated_at", label: t("fields.updatedAt") },
  )

  return filters
}
